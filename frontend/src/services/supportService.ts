import api from './api';

export interface SupportTicket {
  _id: string;
  ride?: {
    pickup?: { address: string };
    drop?: { address: string };
    fare?: number;
    status?: string;
  } | null;
  category: string;
  description: string;
  status: string;
  createdAt: string;
}

export const supportService = {
  async createTicket(data: { rideId?: string; category?: string; description: string }) {
    const response = await api.post('/support/report', data);
    return response.data as { message: string; ticket: SupportTicket };
  },

  async getMyTickets() {
    const response = await api.get('/support/my');
    return response.data as { message: string; tickets: SupportTicket[] };
  },
};

export default supportService;
