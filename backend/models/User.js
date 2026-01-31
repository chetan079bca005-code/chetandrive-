import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["customer", "rider"],
      required: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
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
