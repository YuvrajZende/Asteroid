import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GuestState {
  isGuest: boolean;
  setGuest: () => void;
  clearGuest: () => void;
}

/** Guest persists until the user signs in (per v1 spec §4). */
export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      isGuest: false,
      setGuest: () => set({ isGuest: true }),
      clearGuest: () => set({ isGuest: false }),
    }),
    {
      name: 'asteroid_guest',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
