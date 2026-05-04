import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
      default: undefined,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    loginOtp: {
      type: String,
      select: false, // Don't return this in normal queries
    },
    loginOtpExpiry: {
      type: Date,
      select: false,
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    totalRides: {
      type: Number,
      default: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 95,
    },
    cancellationRate: {
      type: Number,
      default: 3,
    },
    memberSince: {
      type: String,
      default: new Date().getFullYear().toString(),
    },
    verificationBadges: {
      type: [String],
      default: ["ID Verified"],
    },
    driverStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    dob: { type: String, default: "" },
    driverPhoto: { type: String, default: "" },
    license: {
      number: { type: String, default: "" },
      photo: { type: String, default: "" },
      expDate: { type: String, default: "" },
    },
    registration: {
      photo: { type: String, default: "" },
    },
    rejectionReason: { type: String, default: "" },
    vehicle: {
      type: {
        type: String,
        enum: [
          "bike",
          "auto",
          "cabEconomy",
          "cabPremium",
          "pickupTruck",
          "miniTruck",
          "largeTruck",
          "containerTruck",
        ],
        default: "cabEconomy",
      },
      make: { type: String, default: "" },
      model: { type: String, default: "" },
      color: { type: String, default: "" },
      licensePlate: { type: String, default: "" },
      year: { type: Number, default: new Date().getFullYear() },
      capacity: { type: Number, default: 4 },
      photo: { type: String, default: "" },
    },
    emergencyContacts: [
      {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        relationship: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.createAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      phone: this.phone,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.createRefreshToken = function () {
  return jwt.sign(
    { id: this._id, phone: this.phone },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

const User = mongoose.model("User", userSchema);
export default User;
