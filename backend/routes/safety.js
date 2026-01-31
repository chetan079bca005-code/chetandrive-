import express from "express";
import {
  getEmergencyContacts,
  addEmergencyContact,
  removeEmergencyContact,
  shareTrip,
  triggerSOS,
} from "../controllers/safety.js";

const router = express.Router();

router.get("/contacts", getEmergencyContacts);
router.post("/contacts", addEmergencyContact);
router.delete("/contacts/:contactId", removeEmergencyContact);
router.post("/share", shareTrip);
router.post("/sos", triggerSOS);

export default router;
