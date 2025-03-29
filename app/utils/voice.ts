const window = globalThis.window as Window;
import { hashString } from "./hash";

const SUPPORTED_LANGUAGES = [
  "en", // English
  // "fr", // French
] as const;

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

  async speak(name: string, text: string): Promise<void> {
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
export const speak = (name: string, text: string) =>
  speechManager.speak(name, text);
export const initializeVoices = () => speechManager.initializeVoices();
