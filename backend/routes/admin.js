import express from 'express';
import { getPendingDrivers, verifyDriver, rejectDriver } from '../controllers/admin.js';
import authMiddleware from '../middleware/authentication.js';

const router = express.Router();

// Apply auth middleware to all admin routes
// router.use(authMiddleware); // Disabled for local testing

router.get('/drivers/pending', getPendingDrivers);
router.post('/drivers/:id/verify', verifyDriver);
router.post('/drivers/:id/reject', rejectDriver);

export default router;
