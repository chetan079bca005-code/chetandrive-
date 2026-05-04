import express from 'express';
import rateLimit from 'express-rate-limit';
import { refreshToken, auth, updateProfile, submitDriverInfo, sendOtp, googleLogin } from '../controllers/auth.js';
import authMiddleware from '../middleware/authentication.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per `window`
  message: { msg: 'Too many authentication attempts from this IP, please try again after 15 minutes', message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send-otp', authLimiter, sendOtp);
router.post('/signin', authLimiter, auth); // Now acts as verify OTP
router.post('/google', authLimiter, googleLogin);

router.post('/refresh-token', authLimiter, refreshToken);
router.patch('/profile', authMiddleware, updateProfile);
router.post('/submit-driver-info', authMiddleware, submitDriverInfo);

export default router;
