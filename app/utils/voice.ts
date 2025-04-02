const window = globalThis.window as Window;
import { hashString } from "./hash";

const SUPPORTED_LANGUAGES = [
  "en", // English
  "fr", // French
] as const;

type VoiceSettings = {
  rate?: number;  // 0.1 to 10, default 1
  pitch?: number; // 0 to 2, default 1
  volume?: number; // 0 to 1, default 1
};

export const NARRATOR_SETTINGS: VoiceSettings = {
  rate: 0.8,     // Much slower for dramatic pauses
  pitch: 0.65,   // Deeper voice for gravitas
  volume: 1,   // Slightly softer for intensity
};

class SpeechManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voicesLoaded: Promise<boolean>;

  constructor() {
    window?.speechSynthesis?.cancel();
    this.voicesLoaded = this.loadVoices();
  }

  private loadVoices(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!window?.speechSynthesis) {
        resolve(false);
        return;
      }

      // Check if voices are already loaded
      const voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(true);
        return;
      }

      // Wait for voices to load
      speechSynthesis.onvoiceschanged = () => {
        const voices = speechSynthesis.getVoices();
        resolve(voices.length > 0);
      };

      // Timeout after 2 seconds
      setTimeout(() => resolve(false), 2000);
    });
  }

  public initializeVoices() {
    if (!window?.speechSynthesis) return;

    const unlock = new SpeechSynthesisUtterance("");
    unlock.volume = 0;
    speechSynthesis.speak(unlock);
  }

  async speak(name: string, text: string, settings?: VoiceSettings): Promise<void> {
    return new Promise(async (resolve) => {
      if (!window?.speechSynthesis) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      if (this.currentUtterance) {
        speechSynthesis.cancel();
        this.currentUtterance = null;
      }

      // Set up timeout based on text length
      const timeoutMs = Math.min(text.length * 1000 + 3000, 60000); // Cap at 60 seconds
      const timeout = setTimeout(() => {
        console.log("Speech timed out");
        if (this.currentUtterance) {
          speechSynthesis.cancel();
          this.currentUtterance = null;
        }
        resolve();
      }, timeoutMs);

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      // Apply voice settings
      if (settings) {
        utterance.rate = settings.rate ?? 1;
        utterance.pitch = settings.pitch ?? 1;
        utterance.volume = settings.volume ?? 1;
      }

      // Try to set a voice if available
      const hasVoices = await this.voicesLoaded;
      if (hasVoices) {
        const voices = speechSynthesis
          .getVoices()
          .filter((v) =>
            SUPPORTED_LANGUAGES.some((lang) => v.lang.startsWith(lang))
          );

        if (voices.length > 0) {
          utterance.voice = voices[hashString(name, voices.length)];
        }
      }

      utterance.onend = () => {
        clearTimeout(timeout);
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        clearTimeout(timeout);
        this.currentUtterance = null;
        resolve();
      };

      try {
        speechSynthesis.speak(utterance);
      } catch (e) {
        console.error("Speech failed:", e);
        clearTimeout(timeout);
        this.currentUtterance = null;
        resolve();
      }
    });
  }
}

const speechManager = new SpeechManager();
export const speak = (name: string, text: string, settings?: VoiceSettings) =>
  speechManager.speak(name, text, settings);
export const initializeVoices = () => speechManager.initializeVoices();
