import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";
import Ride from "../models/Ride.js";
import { BadRequestError, NotFoundError } from "../errors/index.js";

const generateShareToken = () =>
  Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

export const getEmergencyContacts = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");

  res.status(StatusCodes.OK).json({
    message: "Contacts retrieved",
    contacts: user.emergencyContacts || [],
  });
};

export const addEmergencyContact = async (req, res) => {
  const { name, phone, relationship = "" } = req.body;
  if (!name || !phone) {
    throw new BadRequestError("Name and phone are required");
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");

  user.emergencyContacts.push({ name, phone, relationship });
  await user.save();

  res.status(StatusCodes.CREATED).json({
    message: "Contact added",
    contacts: user.emergencyContacts,
  });
};

export const removeEmergencyContact = async (req, res) => {
  const { contactId } = req.params;
  if (!contactId) throw new BadRequestError("Contact ID is required");

  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found");

  user.emergencyContacts = user.emergencyContacts.filter(
    (contact) => contact._id.toString() !== contactId
  );
  await user.save();

  res.status(StatusCodes.OK).json({
    message: "Contact removed",
    contacts: user.emergencyContacts,
  });
};

export const shareTrip = async (req, res) => {
  const { rideId, sharedWith = [], expiresInMinutes = 120 } = req.body;
  if (!rideId) throw new BadRequestError("Ride ID is required");

  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");

  const token = generateShareToken();
  const expiresAt = new Date(Date.now() + Number(expiresInMinutes) * 60 * 1000);

  ride.shareLinks.push({ token, sharedWith, expiresAt });
  await ride.save();

  const shareLink = `${process.env.PUBLIC_BASE_URL || "https://app.example.com"}/track/${rideId}?t=${token}`;

  res.status(StatusCodes.CREATED).json({
    message: "Trip shared",
    shareLink,
    expiresAt,
  });
};

export const triggerSOS = async (req, res) => {
  const { rideId, location } = req.body;
  if (!rideId) throw new BadRequestError("Ride ID is required");

  const ride = await Ride.findById(rideId);
  if (!ride) throw new NotFoundError("Ride not found");

  ride.sosEvents.push({
    triggeredBy: req.user.id,
    location: location || null,
  });
  await ride.save();

  req.io.to(`ride_${rideId}`).emit("sosAlert", {
    rideId,
    triggeredBy: req.user.id,
    location,
  });

  res.status(StatusCodes.OK).json({
    message: "SOS triggered",
  });
};
