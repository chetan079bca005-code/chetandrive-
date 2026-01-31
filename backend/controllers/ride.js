import Ride from "../models/Ride.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";
import { StatusCodes } from "http-status-codes";
import {
  calculateDistance,
  calculateFare,
  generateOTP,
} from "../utils/mapUtils.js";

export const createRide = async (req, res) => {
  const {
    vehicle,
    pickup,
    drop,
    proposedFare,
    serviceType = "city",
    serviceDetails = {},
  } = req.body;

  if (!vehicle || !pickup || !drop || !proposedFare) {
    throw new BadRequestError("Vehicle, pickup, drop, and proposed fare are required");
  }

  const {
    address: pickupAddress,
    latitude: pickupLat,
    longitude: pickupLon,
  } = pickup;

  const { address: dropAddress, latitude: dropLat, longitude: dropLon } = drop;

  if (
    !pickupAddress ||
    !pickupLat ||
    !pickupLon ||
    !dropAddress ||
    !dropLat ||
    !dropLon
  ) {
    throw new BadRequestError("Complete pickup and drop details are required");
  }

  const customer = req.user;

  if (customer.role !== "customer") {
    throw new BadRequestError("Only customers can create rides");
  }

  try {
    const distance = calculateDistance(pickupLat, pickupLon, dropLat, dropLon);
    const fare = calculateFare(distance);
    const recommendedFare = Math.round(fare[vehicle]);
    const normalizedProposedFare = Math.round(Number(proposedFare));
    if (!normalizedProposedFare || normalizedProposedFare <= 0) {
      throw new BadRequestError("Invalid proposed fare");
    }

    const ride = new Ride({
      vehicle,
      serviceType,
      distance,
      fare: normalizedProposedFare,
      proposedFare: normalizedProposedFare,
      recommendedFare,
      serviceDetails,
      pickup: {
        address: pickupAddress,
        latitude: pickupLat,
        longitude: pickupLon,
      },
      drop: { address: dropAddress, latitude: dropLat, longitude: dropLon },
      customer: customer.id,
      otp: generateOTP(),
    });

    await ride.save();

    res.status(StatusCodes.CREATED).json({
      message: "Ride created successfully",
      ride,
    });
  } catch (error) {
    console.error(error);
    throw new BadRequestError("Failed to create ride");
  }
};

export const createRideOffer = async (req, res) => {
  const { rideId } = req.params;
  const { offeredFare, eta = 0, distanceToPickup = 0 } = req.body;

  if (!rideId || !offeredFare) {
    throw new BadRequestError("Ride ID and offered fare are required");
  }

  if (req.user.role !== "rider") {
    throw new BadRequestError("Only riders can make offers");
  }

  const ride = await Ride.findById(rideId).populate("customer rider");
  if (!ride) throw new NotFoundError("Ride not found");

  if (ride.status !== "SEARCHING_FOR_RIDER") {
    throw new BadRequestError("Ride is not accepting offers");
  }

  const offer = {
    driver: req.user.id,
    offeredFare: Math.round(Number(offeredFare)),
    eta: Number(eta) || 0,
    distanceToPickup: Number(distanceToPickup) || 0,
    status: "pending",
  };

  ride.offers.push(offer);
  await ride.save();

  const populatedRide = await Ride.findById(rideId)
    .populate("customer", "name phone rating totalRides")
    .populate("rider", "name phone rating totalRides")
    .populate("offers.driver", "name phone rating totalRides vehicle acceptanceRate cancellationRate memberSince verificationBadges");

  req.socket.to(`ride_${rideId}`).emit("offerUpdate", populatedRide.offers);

  res.status(StatusCodes.CREATED).json({
    message: "Offer created",
    offers: populatedRide.offers,
  });
};

export const counterRideOffer = async (req, res) => {
  const { rideId, offerId } = req.params;
  const { amount, message = "" } = req.body;

  if (!rideId || !offerId || !amount) {
    throw new BadRequestError("Ride ID, offer ID, and amount are required");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");

  const offer = ride.offers.id(offerId);
  if (!offer) throw new NotFoundError("Offer not found");

  const isCustomer = req.user.role === "customer";
  const isRider = req.user.role === "rider";

  if (!isCustomer && !isRider) {
    throw new BadRequestError("Invalid user role");
  }

  if (isCustomer && ride.customer.toString() !== req.user.id) {
    throw new BadRequestError("Only the ride customer can counter offers");
  }

  if (isRider && offer.driver.toString() !== req.user.id) {
    throw new BadRequestError("Only the offer driver can counter offers");
  }

  const from = isRider ? "driver" : "passenger";

  offer.counterOffers.push({
    from,
    amount: Math.round(Number(amount)),
    message,
  });
  offer.status = "countered";
  await ride.save();

  req.socket.to(`ride_${rideId}`).emit("offerUpdate", ride.offers);

  res.status(StatusCodes.OK).json({
    message: "Counter offer sent",
    offers: ride.offers,
  });
};

export const acceptRideOffer = async (req, res) => {
  const { rideId, offerId } = req.params;

  if (!rideId || !offerId) {
    throw new BadRequestError("Ride ID and offer ID are required");
  }

  if (req.user.role !== "customer") {
    throw new BadRequestError("Only customers can accept offers");
  }

  let ride = await Ride.findById(rideId).populate("customer rider");
  if (!ride) throw new NotFoundError("Ride not found");

  if (ride.customer.toString() !== req.user.id) {
    throw new BadRequestError("Only the ride customer can accept offers");
  }

  if (ride.status !== "SEARCHING_FOR_RIDER") {
    throw new BadRequestError("Ride is no longer accepting offers");
  }

  const offer = ride.offers.id(offerId);
  if (!offer) throw new NotFoundError("Offer not found");

  ride.offers.forEach((o) => {
    if (o._id.toString() === offerId) {
      o.status = "accepted";
    } else {
      o.status = "rejected";
    }
  });

  ride.rider = offer.driver;
  ride.fare = offer.offeredFare;
  ride.status = "ACCEPTED";
  ride.acceptedOfferId = offer._id;
  await ride.save();

  ride = await ride.populate("rider", "name phone rating totalRides vehicle acceptanceRate cancellationRate memberSince verificationBadges");

  req.socket.to(`ride_${rideId}`).emit("rideAccepted");
  req.socket.to(`ride_${rideId}`).emit("rideUpdate", ride);

  res.status(StatusCodes.OK).json({
    message: "Offer accepted",
    ride,
  });
};

export const rejectRideOffer = async (req, res) => {
  const { rideId, offerId } = req.params;

  if (!rideId || !offerId) {
    throw new BadRequestError("Ride ID and offer ID are required");
  }

  if (req.user.role !== "customer") {
    throw new BadRequestError("Only customers can reject offers");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");

  if (ride.customer.toString() !== req.user.id) {
    throw new BadRequestError("Only the ride customer can reject offers");
  }

  const offer = ride.offers.id(offerId);
  if (!offer) throw new NotFoundError("Offer not found");

  offer.status = "rejected";
  await ride.save();

  req.socket.to(`ride_${rideId}`).emit("offerUpdate", ride.offers);

  res.status(StatusCodes.OK).json({
    message: "Offer rejected",
    offers: ride.offers,
  });
};

export const getRideOffers = async (req, res) => {
  const { rideId } = req.params;
  if (!rideId) throw new BadRequestError("Ride ID is required");

  const ride = await Ride.findById(rideId)
    .populate("offers.driver", "name phone rating totalRides vehicle acceptanceRate cancellationRate memberSince verificationBadges");

  if (!ride) throw new NotFoundError("Ride not found");

  if (req.user.role !== "customer" || ride.customer.toString() !== req.user.id) {
    throw new BadRequestError("Only the ride customer can view offers");
  }

  res.status(StatusCodes.OK).json({
    message: "Offers retrieved",
    offers: ride.offers,
  });
};

export const cancelRide = async (req, res) => {
  const { rideId } = req.params;
  if (!rideId) throw new BadRequestError("Ride ID is required");

  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");

  if (req.user.role !== "customer") {
    throw new BadRequestError("Only customers can cancel rides");
  }

  if (ride.customer.toString() !== req.user.id) {
    throw new BadRequestError("You can only cancel your own rides");
  }

  if (ride.status === "COMPLETED") {
    throw new BadRequestError("Completed rides cannot be canceled");
  }

  await Ride.findByIdAndDelete(rideId);
  req.socket.to(`ride_${rideId}`).emit("rideCanceled", { message: "Ride canceled" });

  res.status(StatusCodes.OK).json({
    message: "Ride canceled",
  });
};

export const rateRide = async (req, res) => {
  const { rideId } = req.params;
  const { rating, feedbackTags = [], comment = "", tip = 0 } = req.body;

  if (!rideId || !rating) {
    throw new BadRequestError("Ride ID and rating are required");
  }

  const normalizedRating = Number(rating);
  if (normalizedRating < 1 || normalizedRating > 5) {
    throw new BadRequestError("Rating must be between 1 and 5");
  }

  const ride = await Ride.findById(rideId).populate("customer rider");
  if (!ride) throw new NotFoundError("Ride not found");

  const isCustomer = req.user.role === "customer";
  const isRider = req.user.role === "rider";

  if (!isCustomer && !isRider) {
    throw new BadRequestError("Invalid rater role");
  }

  if (ride.status !== "COMPLETED") {
    throw new BadRequestError("Ride must be completed to submit rating");
  }

  if (isCustomer) {
    if (ride.customer.toString() !== req.user.id) {
      throw new BadRequestError("You can only rate your own rides");
    }
    if (!ride.rider || typeof ride.rider === "string") {
      throw new BadRequestError("Ride has no assigned driver");
    }
    if (ride.customerRating?.rating) {
      throw new BadRequestError("Rating already submitted");
    }

    ride.customerRating = {
      rating: normalizedRating,
      feedbackTags,
      comment,
      tip: Number(tip) || 0,
    };

    const driver = ride.rider;
    driver.rating = ((driver.rating || 0) * (driver.ratingCount || 0) + normalizedRating) / ((driver.ratingCount || 0) + 1);
    driver.ratingCount = (driver.ratingCount || 0) + 1;
    await driver.save();
  }

  if (isRider) {
    if (!ride.rider || ride.rider.toString() !== req.user.id) {
      throw new BadRequestError("You can only rate your own rides");
    }
    if (!ride.customer || typeof ride.customer === "string") {
      throw new BadRequestError("Ride has no assigned customer");
    }
    if (ride.riderRating?.rating) {
      throw new BadRequestError("Rating already submitted");
    }

    ride.riderRating = {
      rating: normalizedRating,
      feedbackTags,
      comment,
    };

    const customer = ride.customer;
    customer.rating = ((customer.rating || 0) * (customer.ratingCount || 0) + normalizedRating) / ((customer.ratingCount || 0) + 1);
    customer.ratingCount = (customer.ratingCount || 0) + 1;
    await customer.save();
  }

  await ride.save();

  res.status(StatusCodes.OK).json({
    message: "Rating submitted",
    ride,
  });
};

export const acceptRide = async (req, res) => {
  const riderId = req.user.id;
  const { rideId } = req.params;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  if (req.user.role !== "rider") {
    throw new BadRequestError("Only riders can accept rides");
  }

  try {
    let ride = await Ride.findById(rideId).populate("customer");

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (ride.status !== "SEARCHING_FOR_RIDER") {
      throw new BadRequestError("Ride is no longer available for assignment");
    }

    if (ride.customer.toString() === riderId) {
      throw new BadRequestError("You cannot accept your own ride");
    }

    ride.rider = riderId;
    ride.status = "ACCEPTED";
    await ride.save();

    ride = await ride.populate("rider");

    req.socket.to(`ride_${rideId}`).emit("rideUpdate", ride);
    req.socket.to(`ride_${rideId}`).emit("rideAccepted");

    res.status(StatusCodes.OK).json({
      message: "Ride accepted successfully",
      ride,
    });
  } catch (error) {
    console.error("Error accepting ride:", error);
    throw new BadRequestError("Failed to accept ride");
  }
};

export const updateRideStatus = async (req, res) => {
  const { rideId } = req.params;
  const { status } = req.body;

  if (!rideId || !status) {
    throw new BadRequestError("Ride ID and status are required");
  }

  try {
    if (req.user.role !== "rider") {
      throw new BadRequestError("Only riders can update ride status");
    }

    let ride = await Ride.findById(rideId).populate("customer rider");
    if (!ride.rider || ride.rider.toString() !== req.user.id) {
      throw new BadRequestError("You can only update your assigned ride");
    }

    if (!ride) {
      throw new NotFoundError("Ride not found");
    }

    if (!["ACCEPTED", "ARRIVED", "START", "COMPLETED"].includes(status)) {
      throw new BadRequestError("Invalid ride status");
    }

    ride.status = status;
    await ride.save();

    req.socket.to(`ride_${rideId}`).emit("rideUpdate", ride);

    res.status(StatusCodes.OK).json({
      message: `Ride status updated to ${status}`,
      ride,
    });
  } catch (error) {
    console.error("Error updating ride status:", error);
    throw new BadRequestError("Failed to update ride status");
  }
};

export const getMyRides = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    const query =
      req.user.role === "rider"
        ? { rider: userId }
        : { customer: userId };

    if (status) {
      query.status = status;
    }

    const rides = await Ride.find(query)
      .populate("customer", "name phone")
      .populate("rider", "name phone")
      .sort({ createdAt: -1 });

    res.status(StatusCodes.OK).json({
      message: "Rides retrieved successfully",
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error("Error retrieving rides:", error);
    throw new BadRequestError("Failed to retrieve rides");
  }
};

export const verifyRideOtp = async (req, res) => {
  const { rideId } = req.params;
  const { otp } = req.body;

  if (!rideId || !otp) {
    throw new BadRequestError("Ride ID and OTP are required");
  }

  if (req.user.role !== "rider") {
    throw new BadRequestError("Only riders can verify OTP");
  }

  const ride = await Ride.findById(rideId).populate("customer rider");
  if (!ride) throw new NotFoundError("Ride not found");

  if (!ride.rider || ride.rider.toString() !== req.user.id) {
    throw new BadRequestError("You can only verify OTP for your assigned ride");
  }

  if (ride.otp !== otp) {
    throw new BadRequestError("Invalid OTP");
  }

  ride.status = "START";
  await ride.save();

  req.socket.to(`ride_${rideId}`).emit("rideUpdate", ride);

  res.status(StatusCodes.OK).json({
    message: "OTP verified",
    ride,
  });
};
