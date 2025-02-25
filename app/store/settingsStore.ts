import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  endpoint: string;
  modelName: string;
  availableModels: string[];
  isOpen: boolean;
  setEndpoint: (endpoint: string) => void;
  setModelName: (modelName: string) => void;
  setAvailableModels: (models: string[]) => void;
  toggleSettings: () => void;
  fetchAvailableModels: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      endpoint: "http://localhost:11434",
      modelName: "llama3.2:3b",
      availableModels: [],
      isOpen: false,
      setEndpoint: (endpoint) => set({ endpoint }),
      setModelName: (modelName) => set({ modelName }),
      setAvailableModels: (models) => set({ availableModels: models }),
      toggleSettings: () => set((state) => ({ isOpen: !state.isOpen })),
      fetchAvailableModels: async () => {
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
      }),
    }
  )
);

export const getSettings = () => useSettingsStore.getState();
