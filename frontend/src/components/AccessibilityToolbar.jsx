import React, { useContext, useState } from 'react';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { useTranslation } from '../context/LanguageContext';

const AccessibilityToolbar = () => {
    const { 
        voiceOverEnabled, 
        toggleVoiceOver, 
        highContrast, 
        setHighContrast, 
        fontSizeScale, 
        setFontSizeScale, 
        isSpeaking, 
        stopSpeaking,
        setShowWalkthrough,
        isFullscreen,
        toggleFullscreen,
        showShortcutsModal,
        setShowShortcutsModal
    } = useContext(AccessibilityContext);

    const { lang, setLang, t, availableLanguages } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <div 
                className="position-fixed bottom-0 end-0 m-3"
                style={{ zIndex: 1050 }}
                role="region"
                aria-label="Accessibility & Voiceover Controls"
            >
                {isExpanded && (
                    <div className="card shadow-lg border-primary border-2 p-3 mb-2 bg-white rounded-3 animate-fade-in" style={{ minWidth: '300px' }}>
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <strong className="text-primary small d-flex align-items-center">
                                <span className="me-1">♿</span> {t('accessibility')} &amp; Voice
                            </strong>
                            <button 
                                className="btn-close btn-sm" 
                                onClick={() => setIsExpanded(false)}
                                aria-label="Close accessibility menu"
                            ></button>
                        </div>

                        {/* Language Selection Grid */}
                        <div className="mb-2 p-2 bg-light rounded border">
                            <small className="fw-bold text-dark d-block mb-1">🌐 Select Language / زبان منتخب کریں:</small>
                            <div className="d-flex flex-wrap gap-1">
                                {availableLanguages?.map(item => (
                                    <button 
                                        key={item.code}
                                        type="button"
                                        className={`btn btn-sm px-2 py-1 ${lang === item.code ? 'btn-primary fw-bold shadow-sm' : 'btn-outline-secondary'}`}
                                        style={{ fontSize: '0.75rem' }}
                                        onClick={() => setLang(item.code)}
                                    >
                                        {item.flag} {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Fullscreen Toggle */}
                        <div className="mb-2">
                            <button 
                                className="btn btn-sm btn-outline-dark w-100 fw-bold d-flex justify-content-between align-items-center"
                                onClick={toggleFullscreen}
                            >
                                <span>{isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen Mode'}</span>
                                <span className="badge bg-light text-dark border">Alt + F</span>
                            </button>
                        </div>

                        {/* Voiceover Mode */}
                        <div className="mb-2">
                            <button 
                                className={`btn btn-sm w-100 fw-bold d-flex justify-content-between align-items-center ${
                                    voiceOverEnabled ? 'btn-success' : 'btn-outline-primary'
                                }`}
                                onClick={toggleVoiceOver}
                            >
                                <span>🔊 Voiceover Reader</span>
                                <span className="badge bg-light text-dark">{voiceOverEnabled ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>

                        {/* Stop Speaking Button */}
                        {isSpeaking && (
                            <div className="mb-2">
                                <button 
                                    className="btn btn-sm btn-danger w-100 fw-bold animate-pulse"
                                    onClick={stopSpeaking}
                                >
                                    ⏹️ Stop Speech Voice
                                </button>
                            </div>
                        )}

                        {/* High Contrast */}
                        <div className="mb-2">
                            <button 
                                className={`btn btn-sm w-100 fw-semibold d-flex justify-content-between align-items-center ${
                                    highContrast ? 'btn-dark text-warning' : 'btn-outline-dark'
                                }`}
                                onClick={() => setHighContrast(!highContrast)}
                            >
                                <span>🌓 High Contrast</span>
                                <span className="badge bg-secondary">{highContrast ? 'ON' : 'OFF'}</span>
                            </button>
                        </div>

                        {/* Font Sizing */}
                        <div className="mb-3">
                            <label className="form-label small text-secondary mb-1">Text Scaling</label>
                            <div className="btn-group btn-group-sm w-100" role="group">
                                <button 
                                    type="button" 
                                    className={`btn ${fontSizeScale === 'normal' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setFontSizeScale('normal')}
                                >
                                    A (100%)
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${fontSizeScale === 'large' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setFontSizeScale('large')}
                                >
                                    A+ (125%)
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn ${fontSizeScale === 'xlarge' ? 'btn-primary' : 'btn-outline-secondary'}`}
                                    onClick={() => setFontSizeScale('xlarge')}
                                >
                                    A++ (150%)
                                </button>
                            </div>
                        </div>

                        {/* Keyboard shortcuts & walkthrough buttons */}
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-secondary btn-sm flex-fill fw-bold"
                                onClick={() => setShowShortcutsModal(true)}
                            >
                                ⌨️ Shortcuts
                            </button>
                            <button 
                                className="btn btn-outline-info btn-sm flex-fill fw-bold"
                                onClick={() => {
                                    setIsExpanded(false);
                                    setShowWalkthrough(true);
                                }}
                            >
                                🎥 Guide
                            </button>
                        </div>
                    </div>
                )}

                {/* Floating Trigger Button */}
                <button 
                    className={`btn btn-lg rounded-circle shadow-lg d-flex align-items-center justify-content-center ${
                        voiceOverEnabled || highContrast ? 'btn-success' : 'btn-primary'
                    }`}
                    style={{ width: '56px', height: '56px' }}
                    onClick={() => setIsExpanded(!isExpanded)}
                    title="Accessibility, Speech Voiceover, Fullscreen & Display Options"
                    aria-label="Toggle Accessibility Menu"
                >
                    <span className="fs-4">♿</span>
                </button>
            </div>

            {/* Keyboard Shortcuts Modal */}
            {showShortcutsModal && (
                <div 
                    className="modal show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}
                    onClick={() => setShowShortcutsModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <div className="modal-header bg-dark text-white border-0 py-3">
                                <h5 className="modal-title fw-bold">⌨️ Keyboard Accessibility Shortcuts</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setShowShortcutsModal(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body p-4">
                                <p className="text-muted small mb-3">
                                    LearningSphere is equipped with screen-reader and disability keyboard shortcuts. You can trigger these actions at any time:
                                </p>
                                <div className="table-responsive">
                                    <table className="table table-bordered table-striped align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{ width: '40%' }}>Shortcut</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td><kbd className="bg-primary text-white p-1 rounded">Alt + F</kbd></td>
                                                <td>Toggle Fullscreen Mode</td>
                                            </tr>
                                            <tr>
                                                <td><kbd className="bg-primary text-white p-1 rounded">Alt + V</kbd></td>
                                                <td>Toggle Voiceover Screen Reader (Speech Synthesis)</td>
                                            </tr>
                                            <tr>
                                                <td><kbd className="bg-primary text-white p-1 rounded">Alt + C</kbd></td>
                                                <td>Toggle High-Contrast Visual Mode</td>
                                            </tr>
                                            <tr>
                                                <td><kbd className="bg-primary text-white p-1 rounded">Alt + K</kbd></td>
                                                <td>Open / Close Keyboard Shortcuts Dialog</td>
                                            </tr>
                                            <tr>
                                                <td><kbd className="bg-secondary text-white p-1 rounded">Tab</kbd> / <kbd className="bg-secondary text-white p-1 rounded">Shift+Tab</kbd></td>
                                                <td>Navigate sequentially through focusable elements</td>
                                            </tr>
                                            <tr>
                                                <td><kbd className="bg-secondary text-white p-1 rounded">Enter</kbd> / <kbd className="bg-secondary text-white p-1 rounded">Space</kbd></td>
                                                <td>Activate buttons, links, or play audio</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-primary px-4 fw-bold rounded-pill"
                                    onClick={() => setShowShortcutsModal(false)}
                                >
                                    Got It
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AccessibilityToolbar;
