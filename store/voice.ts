function getVoiceForName(name: string, callback: (voice: SpeechSynthesisVoice | null) => void) {
    let voices = speechSynthesis.getVoices();

    if (voices.length > 0) {
        return callback(pickVoice(name, voices));
    }

    // Listen for voices changed event
    speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        callback(pickVoice(name, voices));
    };
}

function pickVoice(name: string, voices: SpeechSynthesisVoice[]) {
    const seed = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const voiceIndex = seed % voices.length;
    return voices[voiceIndex];
}

export function readOutLoud(name: string, text: string) {
    const utterance = new SpeechSynthesisUtterance(text);

    getVoiceForName(name, (voice) => {
        if (voice) {
            utterance.voice = voice;
        }
        speechSynthesis.speak(utterance);
    });
}
