const window = globalThis.window as Window;
window?.speechSynthesis?.cancel();

export async function speak(name: string, text: string) {
    // Ensure any ongoing speech is cancelled
    speechSynthesis.cancel();

    // Wait for voices to be available
    await new Promise<void>((resolve) => {
        const voices = speechSynthesis.getVoices();
        if (voices && voices.length > 0) {
            resolve();
        } else {
            speechSynthesis.onvoiceschanged = () => resolve();
        }
    });

    // After loading, try to fetch voices again
    const voices = speechSynthesis.getVoices();
    if (!voices || voices.length === 0) {
        console.warn("No voices available.");
        return;
    }

    // Derive a seed from the name to pick a persistent voice
    const seed = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const voiceIndex = seed % voices.length;
    const voice = voices[voiceIndex];

    // Create and speak the utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;
    speechSynthesis.speak(utterance);
}
