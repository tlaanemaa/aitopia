const window = globalThis.window as Window;
window?.speechSynthesis?.cancel();

export async function speak(name: string, text: string) {
  // Check if speech synthesis is supported
  if (!window?.speechSynthesis) {
    console.warn("Speech synthesis not supported in this browser");
    return;
  }

  // Ensure any ongoing speech is cancelled
  speechSynthesis.cancel();

  try {
    // iOS Safari specific workaround to ensure speech synthesis works
    if (
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    ) {
      speechSynthesis.resume();
    }

    // Wait for voices to be available
    await new Promise<void>((resolve, reject) => {
      const voices = speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        resolve();
      } else {
        // Set a timeout to avoid hanging indefinitely
        const timeout = setTimeout(() => {
          reject(new Error("Timeout waiting for voices"));
        }, 3000);

        speechSynthesis.onvoiceschanged = () => {
          clearTimeout(timeout);
          resolve();
        };
      }
    });

    // After loading, try to fetch voices again
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
      throw new Error("No voices available");
    }

    // Derive a seed from the name to pick a persistent voice
    const seed = Array.from(name).reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0
    );
    const voiceIndex = seed % voices.length;
    const voice = voices[voiceIndex];

    // Create and speak the utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;

    // iOS Safari specific workaround
    if (
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    ) {
      utterance.rate = 1.1; // Slightly faster rate for iOS
      utterance.pitch = 1.0;
      utterance.volume = 1.0; // Maximum volume for iOS

      // Add event listeners to handle iOS quirks
      utterance.onstart = () => speechSynthesis.resume();
      utterance.onend = () => speechSynthesis.resume();
      utterance.onerror = () => speechSynthesis.resume();
    }

    speechSynthesis.speak(utterance);
  } catch (error) {
    console.warn("Speech synthesis failed:", error);
    // Try to recover speech synthesis
    if (
      typeof window !== "undefined" &&
      /iPad|iPhone|iPod/.test(window.navigator.userAgent)
    ) {
      speechSynthesis.resume();
    }
  }
}
