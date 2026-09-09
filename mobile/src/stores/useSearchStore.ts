import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AIResponse, CodeResponse, ModelId, SearchResponse, SearchType } from '@/types/api';

export interface RecentSearch {
  libId: string;
  query: string;
  model: ModelId;
  type: SearchType;
  timestamp: number;
}

export type ConversationStage = 'searching' | 'synthesizing' | 'done' | 'error';

export interface ConversationTurn {
  id: string;
  query: string;
  stage: ConversationStage;
  search?: SearchResponse;
  ai?: AIResponse | null;
  code?: CodeResponse;
  error?: string;
  startedAt: number;
}

export interface Conversation {
  libId: string;
  query: string;
  model: ModelId;
  type: SearchType;
  stage: ConversationStage;
  turns?: ConversationTurn[];
  search?: SearchResponse;
  ai?: AIResponse | null; // null = graceful degrade (AI unavailable, show web results)
  code?: CodeResponse;
  error?: string;
  startedAt: number;
}

const MAX_RECENTS = 20;

interface SearchState {
  recents: RecentSearch[];
  conversations: Record<string, Conversation>;
  addRecent: (entry: RecentSearch) => void;
  removeRecent: (libId: string) => void;
  clearRecents: () => void;
  cacheConversation: (conversation: Conversation) => void;
  updateConversation: (libId: string, patch: Partial<Conversation>) => void;
  getConversation: (libId: string) => Conversation | undefined;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      recents: [],
      conversations: {},

      addRecent: (entry) =>
        set((state) => ({
          recents: [entry, ...state.recents.filter((r) => r.libId !== entry.libId)].slice(0, MAX_RECENTS),
        })),

      removeRecent: (libId) =>
        set((state) => ({ recents: state.recents.filter((r) => r.libId !== libId) })),

      clearRecents: () => set({ recents: [] }),

      cacheConversation: (conversation) =>
        set((state) => ({
          conversations: { ...state.conversations, [conversation.libId]: conversation },
        })),

      updateConversation: (libId, patch) =>
        set((state) => {
          const existing = state.conversations[libId];
          if (!existing) return state;
          return {
            conversations: { ...state.conversations, [libId]: { ...existing, ...patch } },
          };
        }),

      getConversation: (libId) => get().conversations[libId],
    }),
    {
      name: 'asteroid_search',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Compact unique id for history entries — no extra dependency. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
