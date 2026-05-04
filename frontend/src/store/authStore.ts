import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens } from '../types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  activeRole: 'rider' | 'driver';
  
  // Actions
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setOnboarded: (onboarded: boolean) => void;
  setActiveRole: (role: 'rider' | 'driver') => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      isOnboarded: false,
      activeRole: 'rider',
      
      setUser: (user) => set({ user }),
      
      setTokens: (tokens) =>
        set({
          tokens,
          isAuthenticated: Boolean(tokens && get().user),
        }),
      
      login: (user, tokens) => set({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        activeRole: 'rider',
      }),
      
      logout: () => set({
        user: null,
        tokens: null,
        isAuthenticated: false,
        activeRole: 'rider',
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setOnboarded: (isOnboarded) => set({ isOnboarded }),

      setActiveRole: (activeRole) => set({ activeRole }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
        activeRole: state.activeRole,
      }),
    }
  )
);
