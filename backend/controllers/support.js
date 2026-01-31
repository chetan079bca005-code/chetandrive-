import { StatusCodes } from 'http-status-codes';
import SupportTicket from '../models/SupportTicket.js';
import Ride from '../models/Ride.js';
import { BadRequestError, NotFoundError } from '../errors/index.js';

export const createSupportTicket = async (req, res) => {
  const { rideId, category = 'other', description } = req.body;

  if (!description) {
    throw new BadRequestError('Description is required');
  }

  let ride = null;
  if (rideId) {
    ride = await Ride.findById(rideId);
    if (!ride) throw new NotFoundError('Ride not found');
  }

  const ticket = new SupportTicket({
    user: req.user.id,
    ride: ride ? ride._id : null,
    category,
    description,
  });

  await ticket.save();

  res.status(StatusCodes.CREATED).json({
    message: 'Support ticket created',
    ticket,
  });
};

export const getMyTickets = async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user.id })
    .populate('ride', 'pickup drop fare status')
    .sort({ createdAt: -1 });

  res.status(StatusCodes.OK).json({
    message: 'Tickets retrieved',
    tickets,
  });
};
