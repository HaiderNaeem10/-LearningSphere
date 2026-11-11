import React, { createContext, useState, useEffect, useCallback } from 'react';
import speechService from '../services/speechService';

export const AccessibilityContext = createContext();

export const AccessibilityProvider = ({ children }) => {
    const [voiceOverEnabled, setVoiceOverEnabled] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [fontSizeScale, setFontSizeScale] = useState('normal'); // 'normal', 'large', 'xlarge'
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showShortcutsModal, setShowShortcutsModal] = useState(false);

    useEffect(() => {
        const unsubscribe = speechService.subscribe((speaking) => {
            setIsSpeaking(speaking);
        });
        return () => unsubscribe();
    }, []);

    // Fullscreen state listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Apply high-contrast and font sizing to document root
    useEffect(() => {
        const root = document.documentElement;
        if (highContrast) {
            root.classList.add('high-contrast-mode');
        } else {
            root.classList.remove('high-contrast-mode');
        }

        root.classList.remove('font-scale-large', 'font-scale-xlarge');
        if (fontSizeScale === 'large') {
            root.classList.add('font-scale-large');
        } else if (fontSizeScale === 'xlarge') {
            root.classList.add('font-scale-xlarge');
        }
    }, [highContrast, fontSizeScale]);

    const speak = useCallback((text, onEnd) => {
        speechService.speak(text, onEnd);
    }, []);

    const stopSpeaking = useCallback(() => {
        speechService.stop();
    }, []);

    const toggleVoiceOver = useCallback(() => {
        setVoiceOverEnabled(prev => {
            const next = !prev;
            if (next) {
                speechService.speak("Voiceover accessibility mode activated. Click on any text, lecture, or quiz question to hear it spoken aloud.");
            } else {
                speechService.stop();
            }
            return next;
        });
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(err => {
                console.warn("Fullscreen request error:", err);
            });
        } else {
            document.exitFullscreen?.().catch(err => {
                console.warn("Exit fullscreen error:", err);
            });
        }
    }, []);

    // Global accessibility keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Check Alt combinations
            if (e.altKey) {
                if (e.key === 'f' || e.key === 'F') {
                    e.preventDefault();
                    toggleFullscreen();
                } else if (e.key === 'v' || e.key === 'V') {
                    e.preventDefault();
                    toggleVoiceOver();
                } else if (e.key === 'c' || e.key === 'C') {
                    e.preventDefault();
                    setHighContrast(prev => !prev);
                } else if (e.key === 'k' || e.key === 'K') {
                    e.preventDefault();
                    setShowShortcutsModal(prev => !prev);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleFullscreen, toggleVoiceOver]);

    return (
        <AccessibilityContext.Provider value={{
            voiceOverEnabled,
            toggleVoiceOver,
            highContrast,
            setHighContrast,
            fontSizeScale,
            setFontSizeScale,
            isSpeaking,
            speak,
            stopSpeaking,
            showWalkthrough,
            setShowWalkthrough,
            isFullscreen,
            toggleFullscreen,
            showShortcutsModal,
            setShowShortcutsModal
        }}>
            {children}
        </AccessibilityContext.Provider>
    );
};
