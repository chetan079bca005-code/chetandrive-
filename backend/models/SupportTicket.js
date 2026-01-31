import mongoose from 'mongoose';

const { Schema } = mongoose;

const supportTicketSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ride: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
    },
    category: {
      type: String,
      enum: ['late_arrival', 'unsafe_driving', 'fare_dispute', 'app_issue', 'other'],
      default: 'other',
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved'],
      default: 'open',
    },
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
export default SupportTicket;
