// LearnSphere Text-to-Speech (TTS) Voiceover Service for Accessibility

class SpeechService {
    constructor() {
        this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
        this.currentUtterance = null;
        this.isSpeaking = false;
        this.onStateChangeCallbacks = [];
    }

    subscribe(callback) {
        this.onStateChangeCallbacks.push(callback);
        return () => {
            this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter(cb => cb !== callback);
        };
    }

    notify(state) {
        this.isSpeaking = state;
        this.onStateChangeCallbacks.forEach(cb => cb(state));
    }

    speak(text, onEndCallback = null) {
        if (!this.synth) {
            console.warn('SpeechSynthesis is not supported in this environment.');
            return;
        }

        // Cancel any ongoing speech
        this.stop();

        if (!text || text.trim() === '') return;

        // Clean up markdown syntax for natural voice reading
        const cleanText = text
            .replace(/[#*_`~>-]/g, '')
            .replace(/https?:\/\/\S+/g, 'link')
            .replace(/```[\s\S]*?```/g, 'Code block omitted for listening.')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.rate = 0.95; // Slightly slower, clear pace for accessibility
        utterance.pitch = 1.0;

        // Select an English voice if available
        const voices = this.synth.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Online') || v.name.includes('David') || v.name.includes('Zira')));
        if (englishVoice) {
            utterance.voice = englishVoice;
        }

        utterance.onstart = () => {
            this.notify(true);
        };

        utterance.onend = () => {
            this.notify(false);
            if (onEndCallback) onEndCallback();
        };

        utterance.onerror = (e) => {
            console.error('TTS error:', e);
            this.notify(false);
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
    }

    pause() {
        if (this.synth && this.synth.speaking) {
            this.synth.pause();
            this.notify(false);
        }
    }

    resume() {
        if (this.synth && this.synth.paused) {
            this.synth.resume();
            this.notify(true);
        }
    }

    stop() {
        if (this.synth) {
            this.synth.cancel();
            this.notify(false);
        }
    }
}

const speechService = new SpeechService();
export default speechService;
