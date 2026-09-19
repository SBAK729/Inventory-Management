import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'STOREKEEPER';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: Role;
  departmentId: number | null;
  mustChangePassword: boolean;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  setMustChangePassword: (value: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      setMustChangePassword: (mustChangePassword) =>
        set((state) => ({
          user: state.user ? { ...state.user, mustChangePassword } : null,
        })),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'otech-auth', // localStorage key
    },
  ),
);