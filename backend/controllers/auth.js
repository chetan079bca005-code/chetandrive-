import User from "../models/User.js";
import { uploadImage } from "../utils/cloudinary.js";
import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnauthenticatedError } from "../errors/index.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { generateOTP } from "../utils/mapUtils.js";
import { sendEmailOTP } from "../utils/email.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) throw new BadRequestError("Email is required");

  let user = await User.findOne({ email });

  const otp = generateOTP();
  const loginOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

  if (!user) {
    user = new User({
      email,
      loginOtp: otp,
      loginOtpExpiry,
    });
  } else {
    user.loginOtp = otp;
    user.loginOtpExpiry = loginOtpExpiry;
  }
  await user.save();

  await sendEmailOTP(email, otp);
  return res.status(StatusCodes.OK).json({ message: "OTP sent successfully to email" });
};

export const auth = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new BadRequestError("Email and OTP are required");
  }

  // Find user and explicitly select loginOtp and loginOtpExpiry which are select: false
  const user = await User.findOne({ email }).select("+loginOtp +loginOtpExpiry");

  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (!user.loginOtp || !user.loginOtpExpiry || user.loginOtp !== otp) {
    throw new UnauthenticatedError("Invalid OTP");
  }

  if (Date.now() > user.loginOtpExpiry.getTime()) {
    throw new UnauthenticatedError("OTP has expired");
  }

  // Clear OTP after successful login
  user.loginOtp = undefined;
  user.loginOtpExpiry = undefined;
  await user.save();

  const accessToken = user.createAccessToken();
  const refreshToken = user.createRefreshToken();

  return res.status(StatusCodes.OK).json({
    message: "User logged in successfully",
    user,
    access_token: accessToken,
    refresh_token: refreshToken,
  });
};

export const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    throw new BadRequestError("Google ID token is required");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        name,
      });
      await user.save();
    }

    const accessToken = user.createAccessToken();
    const refreshToken = user.createRefreshToken();

    return res.status(StatusCodes.OK).json({
      message: "Google login successful",
      user,
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  } catch (error) {
    console.error("Google verify error:", error);
    throw new UnauthenticatedError("Invalid Google token");
  }
};

export const refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    const payload = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      throw new UnauthenticatedError("Invalid refresh token");
    }

    const newAccessToken = user.createAccessToken();
    const newRefreshToken = user.createRefreshToken();

    res.status(StatusCodes.OK).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    throw new UnauthenticatedError("Invalid refresh token");
  }
};

export const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;
  const updates = {};

  if (name !== undefined) {
    const normalizedName = String(name).trim();
    if (!normalizedName) {
      throw new BadRequestError("Name cannot be empty");
    }
    updates.name = normalizedName;
  }

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new BadRequestError("Please provide a valid email");
    }
    updates.email = normalizedEmail;
  }

  if (phone !== undefined) {
    const normalizedPhone = String(phone).trim();
    if (!normalizedPhone) {
      throw new BadRequestError("Phone cannot be empty");
    }
    updates.phone = normalizedPhone;
  }

  if (!Object.keys(updates).length) {
    throw new BadRequestError("At least one profile field is required");
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  res.status(StatusCodes.OK).json({
    message: "Profile updated successfully",
    user,
  });
};

export const submitDriverInfo = async (req, res) => {
  const {
    name,
    dob,
    driverPhoto,
    vehicleType,
    licenseNumber,
    licensePhoto,
    licenseExpDate,
    make,
    model,
    color,
    licensePlate,
    year,
    capacity,
    registrationPhoto,
  } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new UnauthenticatedError("User not found");
  }

  if (user.driverStatus === "verified" || user.driverStatus === "pending") {
    throw new BadRequestError(`Cannot submit info. Current status: ${user.driverStatus}`);
  }

  // Upload images to Cloudinary
  let driverPhotoUrl = driverPhoto;
  let licensePhotoUrl = licensePhoto;
  let registrationPhotoUrl = registrationPhoto;

  try {
    if (driverPhoto) driverPhotoUrl = await uploadImage(driverPhoto);
    if (licensePhoto) licensePhotoUrl = await uploadImage(licensePhoto);
    if (registrationPhoto) registrationPhotoUrl = await uploadImage(registrationPhoto);
  } catch (error) {
    throw new BadRequestError("Failed to upload images. Please try again.");
  }

  user.name = name || user.name;
  user.dob = dob;
  user.driverPhoto = driverPhotoUrl;
  
  user.license = {
    number: licenseNumber,
    photo: licensePhotoUrl,
    expDate: licenseExpDate,
  };

  user.vehicle = {
    ...user.vehicle,
    make,
    model,
    color,
    licensePlate,
    year,
    capacity,
    type: vehicleType,
  };

  user.registration = {
    photo: registrationPhotoUrl,
  };

  user.driverStatus = "pending";
  user.rejectionReason = "";

  await user.save();

  res.status(StatusCodes.OK).json({
    message: "Driver information submitted successfully. Awaiting verification.",
    user,
  });
};
