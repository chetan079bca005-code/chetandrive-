import express from "express";
import {
  getRideMessages,
  markRideMessagesAsRead,
  sendRideMessage,
} from "../controllers/chat.js";

const router = express.Router();

router.get("/:rideId", getRideMessages);
router.post("/:rideId", sendRideMessage);
router.patch("/:rideId/read", markRideMessagesAsRead);

export default router;
