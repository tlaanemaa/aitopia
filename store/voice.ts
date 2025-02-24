const window = globalThis.window as Window;
window?.speechSynthesis?.cancel();

const SUPPORTED_LANGUAGES = [
  'en', // English
  'fr', // French
  // Easy to add more:
  // 'de', // German
  // 'es', // Spanish
  // 'it', // Italian
];

class SpeechManager {
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    window?.speechSynthesis?.cancel();
  }

  // Initialize speech on first user interaction
  public initializeVoices() {
    if (!window?.speechSynthesis) return;
    
    const unlock = new SpeechSynthesisUtterance('');
    unlock.volume = 0;
    speechSynthesis.speak(unlock);
  }

  speak(name: string, text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!window?.speechSynthesis) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      if (this.currentUtterance) {
        speechSynthesis.cancel();
        this.currentUtterance = null;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = () => {
        this.currentUtterance = null;
        resolve();
      };

      this.setVoiceAndSpeak(utterance, name);
    });
  }

  private setVoiceAndSpeak(utterance: SpeechSynthesisUtterance, name: string) {
    const allVoices = speechSynthesis.getVoices();
    const voices = allVoices.filter(voice => 
      SUPPORTED_LANGUAGES.some(lang => voice.lang.startsWith(lang))
    );

    if (voices.length > 0) {
      const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
      utterance.voice = voices[seed % voices.length];
      utterance.lang = utterance.voice.lang; // Match the language to the voice
      speechSynthesis.speak(utterance);
    } else {
      speechSynthesis.onvoiceschanged = () => {
        const newVoices = speechSynthesis.getVoices().filter(voice => 
          SUPPORTED_LANGUAGES.some(lang => voice.lang.startsWith(lang))
        );
        const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
        utterance.voice = newVoices[seed % newVoices.length];
        utterance.lang = utterance.voice.lang;
        speechSynthesis.speak(utterance);
      };
    }
  }
}

const speechManager = new SpeechManager();
export const speak = (name: string, text: string) => speechManager.speak(name, text);
export const initializeVoices = () => speechManager.initializeVoices();
