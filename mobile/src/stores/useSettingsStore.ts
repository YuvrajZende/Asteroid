import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MODEL } from '@/services/models';
import type { ModelId } from '@/types/api';

interface SettingsState {
  model: ModelId;
  setModel: (model: ModelId) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      model: DEFAULT_MODEL,
      setModel: (model) => set({ model }),
    }),
    {
      name: 'asteroid_settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
