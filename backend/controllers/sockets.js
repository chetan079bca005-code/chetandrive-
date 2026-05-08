import geolib from "geolib";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Ride from "../models/Ride.js";
import ChatMessage from "../models/ChatMessage.js";
import { matchRidersAndDrivers } from "../utils/matcher.js";

const onDutyRiders = new Map();
const pendingRideRequests = new Map(); // Store unmatched rides here for batch processing

const handleSocketConnection = (io) => {
  // Batch Matching Cron Loop (runs every 10 seconds) -> The "Broker"
  setInterval(async () => {
    if (pendingRideRequests.size === 0 || onDutyRiders.size === 0) return;

    // Convert Maps to Arrays
    const ridersArray = Array.from(pendingRideRequests.values());
    const driversArray = Array.from(onDutyRiders.values());

    // Call Gale-Shapley / Hungarian Matching
    const matches = matchRidersAndDrivers(ridersArray, driversArray);

    for (const match of matches) {
      const { riderId: rideId, driverSocket } = match;
      const rideObj = pendingRideRequests.get(rideId);
      
      if (rideObj && rideObj.rideData) {
        // Automatically send the optimized matched dispatch
        io.to(driverSocket).emit("optimizedRideOffer", rideObj.rideData);
        // Remove from pending so we don't dispatch it repeatedly in the next cycle unless rejected
        pendingRideRequests.delete(rideId);
      }
    }
  }, 10000); // 10s Batch Window

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.access_token ||
        socket.handshake.headers?.access_token ||
        socket.handshake.headers?.["access-token"] ||
        (socket.handshake.headers?.authorization || "").replace(/^Bearer\s+/i, "");
      if (!token) return next(new Error("Authentication invalid: No token"));

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(payload.id);
      if (!user) return next(new Error("Authentication invalid: User not found"));

      socket.user = {
        id: payload.id,
        role: user.role,
        driverStatus: user.driverStatus,
        driverStatus: user.driverStatus,
        profile: {
          _id: user._id,
          name: user.name || user.phone,
          phone: user.phone,
          rating: user.rating || 4.8,
          totalRides: user.totalRides || 0,
          acceptanceRate: user.acceptanceRate || 95,
          cancellationRate: user.cancellationRate || 3,
          memberSince: user.memberSince || "2023",
          verificationBadges: user.verificationBadges || ["ID Verified"],
          vehicle: user.vehicle || { type: "cabEconomy" },
        },
      };
      next();
    } catch (error) {
      console.error("Socket Auth Error:", error);
      next(new Error("Authentication invalid: Token verification failed"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`User Joined: ${user.id} (${user.role})`);

    if (user.role === "rider") {
      socket.on("goOnDuty", async (coords) => {
        onDutyRiders.set(user.id, {
          socketId: socket.id,
          coords,
          riderId: user.id,
          profile: socket.user.profile,
        });
        socket.join("onDuty");
        console.log(`rider ${user.id} is now on duty.`);
        
        // Geospatial Indexing step - save location to DB for batch matching
        try {
          await User.findByIdAndUpdate(user.id, {
            isOnline: true,
            currentLocation: {
              type: "Point",
              coordinates: [coords.longitude, coords.latitude]
            }
          });
        } catch(e) { console.error("DB update error on duty", e) }

        updateNearbyriders();
      });

      socket.on("goOffDuty", async () => {
        onDutyRiders.delete(user.id);
        socket.leave("onDuty");
        console.log(`rider ${user.id} is now off duty.`);

        try {
          await User.findByIdAndUpdate(user.id, { isOnline: false });
        } catch(e) { console.error("DB update error off duty", e) }

        updateNearbyriders();
      });

      socket.on("updateLocation", async (coords) => {
        if (onDutyRiders.has(user.id)) {
          onDutyRiders.get(user.id).coords = coords;
          console.log(`rider ${user.id} updated location.`);

          try {
            await User.findByIdAndUpdate(user.id, {
              currentLocation: {
                type: "Point",
                coordinates: [coords.longitude, coords.latitude]
              }
            });
          } catch(e) {}

          updateNearbyriders();
          socket.to(`rider_${user.id}`).emit("riderLocationUpdate", {
            riderId: user.id,
            coords,
          });
        }
      });

      socket.on("makeOffer", async ({ rideId, offeredFare, eta = 0, distanceToPickup = 0 }) => {
        try {
          const ride = await Ride.findById(rideId);
          if (!ride) return socket.emit("error", { message: "Ride not found" });

          if (ride.status !== "SEARCHING_FOR_RIDER") {
            return socket.emit("error", { message: "Ride is not accepting offers" });
          }

          ride.offers.push({
            driver: user.id,
            offeredFare: Math.round(Number(offeredFare)),
            eta: Number(eta) || 0,
            distanceToPickup: Number(distanceToPickup) || 0,
            status: "pending",
          });

          await ride.save();
          io.to(`ride_${rideId}`).emit("offerUpdate", ride.offers);
        } catch (error) {
          console.error("Error making offer:", error);
          socket.emit("error", { message: "Failed to make offer" });
        }
      });
    }

    if (user.role === "customer") {
      socket.on("subscribeToZone", (customerCoords) => {
        socket.user.coords = customerCoords;
        sendNearbyRiders(socket, customerCoords);
      });

      socket.on("searchrider", async (rideId) => {
        try {
          const ride = await Ride.findById(rideId).populate("customer rider");
          if (!ride) return socket.emit("error", { message: "Ride not found" });

          // Add to pending batch queue for the Hungarian Engine broker
          pendingRideRequests.set(rideId, {
            rideId,
            pickup: {
              latitude: ride.pickup.location?.coordinates[1] || ride.pickup.latitude,
              longitude: ride.pickup.location?.coordinates[0] || ride.pickup.longitude
            },
            vehicle: ride.vehicle,
            rideData: ride
          });

          let retries = 0;
          let rideAccepted = false;
          let canceled = false;
          const MAX_RETRIES = 20;

          // Legacy search (Broadcast model) fallback
          const retrySearch = async () => {
            if (canceled || rideAccepted) return;
            retries++;
            
            // If the matching broker didn't pick it up (e.g. strict radius issue), let's broad sweep fallback
            const pickupLat = ride.pickup.location?.coordinates[1] || ride.pickup.latitude;
            const pickupLon = ride.pickup.location?.coordinates[0] || ride.pickup.longitude;

            const riders = sendNearbyRiders(socket, { latitude: pickupLat, longitude: pickupLon }, ride);
            if (retries >= MAX_RETRIES) {
              clearInterval(retryInterval);
              if (!rideAccepted) {
                pendingRideRequests.delete(rideId);
                await Ride.findByIdAndDelete(rideId);
                socket.emit("error", { message: "No riders found within 5 minutes." });
              }
            }
          };

          const retryInterval = setInterval(retrySearch, 10000);

          socket.on("rideAccepted", () => {
            rideAccepted = true;
            pendingRideRequests.delete(rideId);
            clearInterval(retryInterval);
          });

          socket.on("cancelRide", async () => {
            canceled = true;
            pendingRideRequests.delete(rideId);
            clearInterval(retryInterval);
            await Ride.findByIdAndDelete(rideId);
            socket.emit("rideCanceled", { message: "Ride canceled" });

            if (ride.rider) {
              const riderSocket = getRiderSocket(ride.rider._id);
              riderSocket?.emit("rideCanceled", { message: `Customer ${user.id} canceled the ride.` });
            }
            console.log(`Customer ${user.id} canceled ride ${rideId}`);
          });
        } catch (error) {
          console.error("Error searching for rider:", error);
          socket.emit("error", { message: "Error searching for rider" });
        }
      });

      socket.on("counterOffer", async ({ rideId, offerId, amount, message = "" }) => {
        try {
          const ride = await Ride.findById(rideId);
          if (!ride) return socket.emit("error", { message: "Ride not found" });

          const offer = ride.offers.id(offerId);
          if (!offer) return socket.emit("error", { message: "Offer not found" });

          offer.counterOffers.push({
            from: "passenger",
            amount: Math.round(Number(amount)),
            message,
          });
          offer.status = "countered";
          await ride.save();

          io.to(`ride_${rideId}`).emit("offerUpdate", ride.offers);
        } catch (error) {
          console.error("Error countering offer:", error);
          socket.emit("error", { message: "Failed to counter offer" });
        }
      });
    }

    socket.on("subscribeToriderLocation", (riderId) => {
      const rider = onDutyRiders.get(riderId);
      if (rider) {
        socket.join(`rider_${riderId}`);
        socket.emit("riderLocationUpdate", { riderId, coords: rider.coords });
        console.log(`User ${user.id} subscribed to rider ${riderId}'s location.`);
      }
    });

    socket.on("subscribeRide", async (rideId) => {
      socket.join(`ride_${rideId}`);
      try {
        const rideData = await Ride.findById(rideId)
          .populate("customer rider")
          .populate("offers.driver", "name phone rating totalRides vehicle acceptanceRate cancellationRate memberSince verificationBadges");
        socket.emit("rideData", rideData);
      } catch (error) {
        socket.emit("error", { message: "Failed to receive ride data" });
      }
    });

    socket.on("chat:typing", ({ rideId, isTyping }) => {
      if (!rideId) return;
      socket.to(`ride_${rideId}`).emit("chat:typing", {
        rideId,
        userId: user.id,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on("chat:send", async ({ rideId, content, type = "text" }) => {
      try {
        if (!rideId || !content || !String(content).trim()) return;

        const ride = await Ride.findById(rideId);
        if (!ride) return;

        const isCustomer = ride.customer?.toString() === user.id;
        const isRider = ride.rider?.toString() === user.id;
        if (!isCustomer && !isRider) return;

        const newMessage = await ChatMessage.create({
          ride: rideId,
          sender: user.id,
          senderType: isCustomer ? "passenger" : "driver",
          content: String(content).trim(),
          type,
          readBy: [user.id],
        });

        io.to(`ride_${rideId}`).emit("chat:new", {
          _id: newMessage._id,
          rideId: newMessage.ride,
          senderId: newMessage.sender,
          senderType: newMessage.senderType,
          content: newMessage.content,
          type: newMessage.type,
          read: true,
          createdAt: newMessage.createdAt,
        });
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      if (user.role === "rider") onDutyRiders.delete(user.id);
      console.log(`User ${user.id} disconnected.`);
    });

    function updateNearbyriders() {
      io.sockets.sockets.forEach((socket) => {
        if (socket.user?.role === "customer") {
          const customerCoords = socket.user.coords;
          if (customerCoords) sendNearbyRiders(socket, customerCoords);
        }
      });
    }

    function sendNearbyRiders(socket, location, ride = null) {
      const nearbyriders = Array.from(onDutyRiders.values())
        .map((rider) => ({
          socketId: rider.socketId,
          riderId: rider.riderId,
          coords: rider.coords,
          profile: rider.profile,
          distance: geolib.getDistance(rider.coords, location),
        }))
        .filter((rider) => rider.distance <= 60000)
        .sort((a, b) => a.distance - b.distance);

      socket.emit("nearbyriders", nearbyriders);

      if (ride) {
        nearbyriders.forEach((rider) => {
          io.to(rider.socketId).emit("rideOffer", ride);
        });
      }

      return nearbyriders;
    }

    function getRiderSocket(riderId) {
      const rider = onDutyRiders.get(riderId);
      return rider ? io.sockets.sockets.get(rider.socketId) : null;
    }
  });
};

export default handleSocketConnection;
