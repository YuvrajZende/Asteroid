import type { ModelId } from '@/types/api';

export interface ModelOption {
  id: ModelId;
  name: string;
  description: string;
  icon: string;
}

/** Same option list as the web app (services/Shared.jsx) — keep in sync. */
export const AIModelsOptions: ModelOption[] = [
  {
    id: 'groq',
    name: 'Qwen 3.8 (Groq)',
    description: 'Ultra-fast deep analytical reasoning',
    icon: '⚡',
  },
  {
    id: 'gemini',
    name: 'Gemini 2.0 Flash',
    description: "Google's fast multimodal AI, large context",
    icon: '✨',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter (Multi)',
    description: 'Access multiple models via one router',
    icon: '🔄',
  },
  {
    id: 'zai',
    name: 'z.ai',
    description: 'Advanced reasoning AI (GPT-4o class)',
    icon: '🧠',
  },
];

export const DEFAULT_MODEL: ModelId = 'groq';
