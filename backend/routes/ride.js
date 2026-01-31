import express from 'express';
import {
  createRide,
  updateRideStatus,
  acceptRide,
  getMyRides,
  createRideOffer,
  counterRideOffer,
  acceptRideOffer,
  rejectRideOffer,
  getRideOffers,
  cancelRide,
  rateRide,
  verifyRideOtp,
} from '../controllers/ride.js';

const router = express.Router();

router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

router.post('/create', createRide);
router.patch('/accept/:rideId', acceptRide);
router.patch('/update/:rideId', updateRideStatus);
router.get('/rides', getMyRides);
router.get('/:rideId/offers', getRideOffers);
router.post('/:rideId/offer', createRideOffer);
router.post('/:rideId/offer/:offerId/counter', counterRideOffer);
router.post('/:rideId/offer/:offerId/accept', acceptRideOffer);
router.post('/:rideId/offer/:offerId/reject', rejectRideOffer);
router.post('/:rideId/cancel', cancelRide);
router.post('/:rideId/rate', rateRide);
router.post('/:rideId/verify-otp', verifyRideOtp);

export default router;
