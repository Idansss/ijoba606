import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';
import { User, Profile } from '@/lib/types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  user: null,
  profile: null,
  loading: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));

