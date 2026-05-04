import User from "../models/User.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";

// @desc    Get all pending driver applications
// @route   GET /api/admin/drivers/pending
export const getPendingDrivers = async (req, res) => {
  // if (req.user.role !== "admin") {
  //   throw new UnauthenticatedError("Not authorized to access this route");
  // }

  const drivers = await User.find({ driverStatus: "pending" })
    .select("-__v")
    .sort({ updatedAt: -1 });

  res.status(StatusCodes.OK).json({ count: drivers.length, drivers });
};

// @desc    Verify a driver
// @route   POST /api/admin/drivers/:id/verify
export const verifyDriver = async (req, res) => {
  // if (req.user.role !== "admin") {
  //   throw new UnauthenticatedError("Not authorized to access this route");
  // }

  const driver = await User.findById(req.params.id);

  if (!driver) {
    throw new BadRequestError("Driver not found");
  }

  driver.driverStatus = "verified";
  driver.rejectionReason = "";
  
  await driver.save();

  res.status(StatusCodes.OK).json({ message: "Driver successfully verified", driver });
};

// @desc    Reject a driver
// @route   POST /api/admin/drivers/:id/reject
export const rejectDriver = async (req, res) => {
  // if (req.user.role !== "admin") {
  //   throw new UnauthenticatedError("Not authorized to access this route");
  // }

  const { reason } = req.body;
  if (!reason) {
    throw new BadRequestError("Rejection reason is required");
  }

  const driver = await User.findById(req.params.id);

  if (!driver) {
    throw new BadRequestError("Driver not found");
  }

  driver.driverStatus = "rejected";
  driver.rejectionReason = reason;
  
  await driver.save();

  res.status(StatusCodes.OK).json({ message: "Driver application rejected", driver });
};
