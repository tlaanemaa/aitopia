import { create } from "zustand";
import { persist } from "zustand/middleware";
import { aiProviders, AiProvider } from "@/ai";

interface SettingsState {
  endpoint: string;
  modelName: string;
  provider: AiProvider;
  availableModels: string[];
  isOpen: boolean;
  geminiKey: string;
  setEndpoint: (endpoint: string) => void;
  setModelName: (modelName: string) => void;
  setProvider: (provider: AiProvider) => void;
  setAvailableModels: (models: string[]) => void;
  setGeminiKey: (key: string) => void;
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
      geminiKey: "",
      setEndpoint: (endpoint) => set({ endpoint }),
      setModelName: (modelName) => set({ modelName }),
      setProvider: (provider) => {
        set({ provider });
        // Fetch models after provider change
        get().fetchAvailableModels();
      },
      setAvailableModels: (models) => set({ availableModels: models }),
      setGeminiKey: (key) => set({ geminiKey: key }),
      toggleSettings: () => set((state) => ({ isOpen: !state.isOpen })),
      fetchAvailableModels: async () => {
        try {
          const currentProvider = get().provider;
          const availableModels = await aiProviders[currentProvider].getModels(get().endpoint) as string[];
          set({ availableModels });

          // If current model isn't in the list, select the first available one
          if (availableModels.length > 0 && !availableModels.includes(get().modelName)) {
            set({ modelName: availableModels[0] });
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
        geminiKey: state.geminiKey,
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
