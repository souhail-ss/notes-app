import axios from 'axios';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

const authApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  const response = await authApi.post<AuthResponse>('/auth/register', credentials);
  return response.data;
};

export const getProfile = async (token: string): Promise<User> => {
  const response = await authApi.get<User>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
