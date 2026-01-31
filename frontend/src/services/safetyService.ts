import api from './api';
import { EmergencyContact, TripShare, Coordinates } from '../types';

interface ContactsResponse {
  message: string;
  contacts: EmergencyContact[];
}

export const safetyService = {
  async getContacts(): Promise<ContactsResponse> {
    const response = await api.get<ContactsResponse>('/safety/contacts');
    return response.data;
  },

  async addContact(data: { name: string; phone: string; relationship?: string }): Promise<ContactsResponse> {
    const response = await api.post<ContactsResponse>('/safety/contacts', data);
    return response.data;
  },

  async removeContact(contactId: string): Promise<ContactsResponse> {
    const response = await api.delete<ContactsResponse>(`/safety/contacts/${contactId}`);
    return response.data;
  },

  async shareTrip(data: { rideId: string; sharedWith?: string[]; expiresInMinutes?: number }): Promise<{ message: string; shareLink: string; expiresAt: string }> {
    const response = await api.post('/safety/share', data);
    return response.data;
  },

  async sendSOS(data: { rideId: string; location?: Coordinates }): Promise<{ message: string }> {
    const response = await api.post('/safety/sos', data);
    return response.data;
  },
};

export default safetyService;
