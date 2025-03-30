import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AiProvider } from "@/theater-core";

const GEMINI_MODELS = ["gemini-2.0-flash-lite"];

interface SettingsState {
  endpoint: string;
  modelName: string;
  provider: AiProvider;
  availableModels: string[];
  isOpen: boolean;
  setEndpoint: (endpoint: string) => void;
  setModelName: (modelName: string) => void;
  setProvider: (provider: AiProvider) => void;
  setAvailableModels: (models: string[]) => void;
  toggleSettings: () => void;
  fetchAvailableModels: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      endpoint: "http://localhost:11434",
      modelName: "llama3.2:3b",
      provider: "ollama",
      availableModels: [],
      isOpen: false,
      setEndpoint: (endpoint) => set({ endpoint }),
      setModelName: (modelName) => set({ modelName }),
      setProvider: (provider) => {
        set({ provider });
        // Fetch models after provider change
        get().fetchAvailableModels();
      },
      setAvailableModels: (models) => set({ availableModels: models }),
      toggleSettings: () => set((state) => ({ isOpen: !state.isOpen })),
      fetchAvailableModels: async () => {
        const currentProvider = get().provider;

        if (currentProvider === "gemini") {
          set({ availableModels: GEMINI_MODELS });
          if (!GEMINI_MODELS.includes(get().modelName)) {
            set({ modelName: GEMINI_MODELS[0] });
          }
          return;
        }

        try {
          const baseUrl = get().endpoint;
          const response = await fetch(`${baseUrl}/api/tags`);
          const data = await response.json();
          const models: string[] = data.models.map(
            (model: { name: string }) => model.name
          );
          set({ availableModels: models });

          // If current model isn't in the list, select the first available one
          if (models.length > 0 && !models.includes(get().modelName)) {
            set({ modelName: models[0] });
          }
        } catch (error) {
          console.error("Failed to fetch models:", error);
          set({ availableModels: [], modelName: "" });
        }
      },
    }),
    {
      name: "settings-storage",
      partialize: (state) => ({
        endpoint: state.endpoint,
        modelName: state.modelName,
        provider: state.provider,
      }),
      onRehydrateStorage: () => (state) => {
        // Fetch models when store is rehydrated
        if (state) {
          state.fetchAvailableModels();
        }
      },
    }
  )
);

export const getSettings = () => useSettingsStore.getState();
