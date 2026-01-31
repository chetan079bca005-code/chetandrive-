import mongoose from 'mongoose';

const { Schema } = mongoose;

const rideSchema = new Schema(
  {
    vehicle: {
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
      required: true,
    },
    serviceType: {
      type: String,
      enum: ["city", "intercity", "delivery", "freight"],
      default: "city",
    },
    distance: {
      type: Number,
      required: true,
    },
    pickup: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    drop: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    fare: {
      type: Number,
      required: true,
    },
    proposedFare: {
      type: Number,
      required: true,
    },
    recommendedFare: {
      type: Number,
      required: true,
    },
    serviceDetails: {
      delivery: {
        packageType: { type: String, default: "" },
        description: { type: String, default: "" },
      },
      freight: {
        vehicleCategory: { type: String, default: "" },
        goodsDescription: { type: String, default: "" },
        weight: { type: String, default: "" },
        services: { type: [String], default: [] },
      },
      intercity: {
        fromCity: { type: String, default: "" },
        toCity: { type: String, default: "" },
        date: { type: String, default: "" },
        passengers: { type: Number, default: 1 },
      },
    },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["SEARCHING_FOR_RIDER", "ACCEPTED", "ARRIVED", "START", "COMPLETED"],
      default: "SEARCHING_FOR_RIDER",
    },
    offers: [
      {
        driver: { type: Schema.Types.ObjectId, ref: "User", required: true },
        offeredFare: { type: Number, required: true },
        eta: { type: Number, default: 0 },
        distanceToPickup: { type: Number, default: 0 },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected", "expired", "countered"],
          default: "pending",
        },
        counterOffers: [
          {
            from: { type: String, enum: ["passenger", "driver"], required: true },
            amount: { type: Number, required: true },
            message: { type: String, default: "" },
            createdAt: { type: Date, default: Date.now },
          },
        ],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    acceptedOfferId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    otp: {
      type: String,
      default: null,
    },
    shareLinks: [
      {
        token: { type: String, required: true },
        sharedWith: { type: [String], default: [] },
        expiresAt: { type: Date, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    sosEvents: [
      {
        triggeredBy: { type: Schema.Types.ObjectId, ref: "User" },
        location: {
          latitude: Number,
          longitude: Number,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    customerRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedbackTags: { type: [String], default: [] },
      comment: { type: String, default: "" },
      tip: { type: Number, default: 0 },
    },
    riderRating: {
      rating: { type: Number, min: 1, max: 5 },
      feedbackTags: { type: [String], default: [] },
      comment: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

const Ride = mongoose.model("Ride", rideSchema);
export default Ride;
