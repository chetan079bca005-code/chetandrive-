import api from './api';
import { AuthResponse, User } from '../types';

interface LoginParams {
  email: string;
  otp: string;
}

interface GoogleLoginParams {
  idToken: string;
}

interface VerifyParams {
  email: string;
}

interface RefreshTokenParams {
  refresh_token: string;
}

interface UpdateProfileParams {
  name?: string;
  email?: string;
}

export interface SubmitDriverInfoParams {
  name: string;
  dob: string;
  driverPhoto: string;
  vehicleType: string;
  licenseNumber: string;
  licensePhoto: string;
  licenseExpDate: string;
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  year: number;
  capacity: number;
  registrationPhoto: string;
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

  async updateProfile(params: UpdateProfileParams & { phone?: string }): Promise<{ message: string; user: User }> {
    const response = await api.patch('/auth/profile', params);
    return response.data;
  },

  async submitDriverInfo(params: SubmitDriverInfoParams): Promise<{ message: string; user: User }> {
    const response = await api.post('/auth/submit-driver-info', params);
    return response.data;
  },
  
  // Verify phone number or email (Sends OTP)
  async verifyPhone(params: VerifyParams): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/auth/send-otp', params);
    return response.data;
  },

  async googleLogin(params: GoogleLoginParams): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/google', params);
    return response.data;
  },
};

export default authService;
