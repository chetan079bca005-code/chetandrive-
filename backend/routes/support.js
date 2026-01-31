import express from 'express';
import { createSupportTicket, getMyTickets } from '../controllers/support.js';

const router = express.Router();

router.post('/report', createSupportTicket);
router.get('/my', getMyTickets);

export default router;
