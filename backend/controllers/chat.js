import { StatusCodes } from "http-status-codes";
import ChatMessage from "../models/ChatMessage.js";
import Ride from "../models/Ride.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";

const getIdString = (docOrId) => {
  if (!docOrId) return "";
  if (typeof docOrId === "string") return docOrId;
  if (typeof docOrId === "object" && docOrId._id) return docOrId._id.toString();
  return docOrId.toString();
};

const ensureRideParticipant = async (rideId, user) => {
  const ride = await Ride.findById(rideId).populate("customer rider");
  if (!ride) {
    throw new NotFoundError("Ride not found");
  }

  const isCustomer = getIdString(ride.customer) === user.id;
  const isRider = ride.rider && getIdString(ride.rider) === user.id;

  if (!isCustomer && !isRider) {
    throw new BadRequestError("You are not part of this ride");
  }

  return {
    ride,
    senderType: isCustomer ? "passenger" : "driver",
  };
};

export const getRideMessages = async (req, res) => {
  const { rideId } = req.params;
  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  await ensureRideParticipant(rideId, req.user);

  const messages = await ChatMessage.find({ ride: rideId }).sort({ createdAt: 1 });

  res.status(StatusCodes.OK).json({
    message: "Messages fetched successfully",
    messages: messages.map((m) => ({
      _id: m._id,
      rideId: m.ride,
      senderId: m.sender,
      senderType: m.senderType,
      content: m.content,
      type: m.type,
      read: m.readBy.some((id) => id.toString() === req.user.id),
      createdAt: m.createdAt,
    })),
  });
};

export const sendRideMessage = async (req, res) => {
  const { rideId } = req.params;
  const { content, type = "text" } = req.body;

  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }
  if (!content || !String(content).trim()) {
    throw new BadRequestError("Message content is required");
  }

  const { senderType } = await ensureRideParticipant(rideId, req.user);

  const chatMessage = await ChatMessage.create({
    ride: rideId,
    sender: req.user.id,
    senderType,
    content: String(content).trim(),
    type,
    readBy: [req.user.id],
  });

  const payload = {
    _id: chatMessage._id,
    rideId: chatMessage.ride,
    senderId: chatMessage.sender,
    senderType: chatMessage.senderType,
    content: chatMessage.content,
    type: chatMessage.type,
    read: true,
    createdAt: chatMessage.createdAt,
  };

  req.io.to(`ride_${rideId}`).emit("chat:new", payload);

  res.status(StatusCodes.CREATED).json({
    message: "Message sent successfully",
    chatMessage: payload,
  });
};

export const markRideMessagesAsRead = async (req, res) => {
  const { rideId } = req.params;
  if (!rideId) {
    throw new BadRequestError("Ride ID is required");
  }

  await ensureRideParticipant(rideId, req.user);

  await ChatMessage.updateMany(
    { ride: rideId, readBy: { $ne: req.user.id } },
    { $addToSet: { readBy: req.user.id } }
  );

  req.io.to(`ride_${rideId}`).emit("chat:read", {
    rideId,
    userId: req.user.id,
  });

  res.status(StatusCodes.OK).json({
    message: "Messages marked as read",
  });
};
