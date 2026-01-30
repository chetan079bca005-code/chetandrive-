import api from './api';
import { AuthResponse, User } from '../types';

interface LoginParams {
  phone: string;
  role: 'customer' | 'rider';
}

interface RefreshTokenParams {
  refresh_token: string;
}

export const authService = {
  // Login or register user
  async login(params: LoginParams): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signin', params);
    return response.data;
  },
  
  // Refresh access token
  async refreshToken(params: RefreshTokenParams): Promise<{ access_token: string; refresh_token: string }> {
    const response = await api.post('/auth/refresh-token', params);
    return response.data;
  },
  
  // Verify phone number (placeholder for OTP verification)
  async verifyPhone(phone: string): Promise<{ success: boolean; message: string }> {
    // In a real app, this would send an OTP
    return { success: true, message: 'OTP sent successfully' };
  },
};

export default authService;
