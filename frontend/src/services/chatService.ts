import api from './api';
import { ChatMessage } from '../types';

export const chatService = {
  async getRideMessages(rideId: string): Promise<{ message: string; messages: ChatMessage[] }> {
    const response = await api.get(`/chat/${rideId}`);
    return response.data;
  },

  async sendRideMessage(
    rideId: string,
    payload: { content: string; type?: 'text' | 'location' | 'image' | 'system' }
  ): Promise<{ message: string; chatMessage: ChatMessage }> {
    const response = await api.post(`/chat/${rideId}`, payload);
    return response.data;
  },

  async markRideMessagesAsRead(rideId: string): Promise<{ message: string }> {
    const response = await api.patch(`/chat/${rideId}/read`);
    return response.data;
  },
};

export default chatService;
