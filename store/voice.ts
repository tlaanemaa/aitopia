function getVoiceForName(name: string) {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) {
        console.warn("Voices not loaded yet. Try running after a short delay.");
        return null;
    }

    const seed = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const voiceIndex = seed % voices.length;
    return voices[voiceIndex];
}

export function readOutLoud(name: string, text: string) {
    const utterance = new SpeechSynthesisUtterance(text);

    function setVoice() {
        const voice = getVoiceForName(name);
        if (voice) {
            utterance.voice = voice;
            speechSynthesis.speak(utterance);
        } else {
            setTimeout(setVoice, 100); // Retry until voices are available
        }
    }

    setVoice();
}