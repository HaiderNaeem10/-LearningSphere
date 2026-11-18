import React, { useState, useRef, useEffect } from 'react';
import speechService from '../services/speechService';
import { getSocraticMentorReply } from '../services/aiMentorService';

const AIMentorDrawer = ({ currentModule, currentLesson, courseTitle, onOpenSandbox }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputQuery, setInputQuery] = useState('');
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: 'ai',
            text: `👋 Hello! I am your **LearnSphere Socratic AI Mentor**. I am actively tracking your work on **Module ${currentModule?.code || '1.1'}: ${currentModule?.title || 'Current Section'}**.\n\nHow can I support your learning today? Ask for hints, architectural breakdowns, or code debugging!`
        }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const chatEndRef = useRef(null);

    // Auto-scroll chat
    useEffect(() => {
        if (isOpen) {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    // Send question
    const handleSend = (textToSend = null) => {
        const query = textToSend || inputQuery;
        if (!query.trim()) return;

        const userMsg = { id: Date.now(), sender: 'user', text: query };
        setMessages(prev => [...prev, userMsg]);
        setInputQuery('');
        setIsThinking(true);

        setTimeout(() => {
            const aiResponse = getSocraticMentorReply({
                userQuery: query,
                currentModule,
                currentLesson,
                courseTitle: courseTitle || 'Full Stack Curriculum'
            });

            const aiMsg = { id: Date.now() + 1, sender: 'ai', text: aiResponse.reply };
            setMessages(prev => [...prev, aiMsg]);
            setIsThinking(false);
        }, 800);
    };

    // Text to Speech for AI message
    const handleSpeak = (text) => {
        speechService.speak(text);
    };

    return (
        <>
            {/* Floating Toggle Pill / Button */}
            <div 
                className="position-fixed shadow-lg"
                style={{ bottom: '28px', right: '28px', zIndex: 1050 }}
            >
                <button 
                    className="btn btn-primary btn-lg rounded-pill px-4 py-3 fw-bold d-flex align-items-center gap-2 shadow"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ border: '3px solid #ffffff' }}
                >
                    <span className="fs-5">{isOpen ? '✕' : '🤖'}</span>
                    <span>{isOpen ? 'Close Mentor' : 'AI Socratic Mentor'}</span>
                    <span className="badge bg-white text-primary rounded-pill small">Online</span>
                </button>
            </div>

            {/* Slide-out Drawer */}
            {isOpen && (
                <div 
                    className="position-fixed bg-white shadow-lg d-flex flex-column rounded-4 border overflow-hidden"
                    style={{
                        bottom: '95px',
                        right: '28px',
                        width: '420px',
                        maxWidth: 'calc(100vw - 40px)',
                        height: '580px',
                        maxHeight: 'calc(100vh - 120px)',
                        zIndex: 1050
                    }}
                >
                    {/* Header */}
                    <div className="p-3 bg-primary text-white d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-2">
                            <span className="fs-4">🧠</span>
                            <div>
                                <h6 className="fw-bold mb-0">LearnSphere Socratic AI Mentor</h6>
                                <small className="opacity-75">Active Context: Module {currentModule?.code || '1.1'}</small>
                            </div>
                        </div>
                        <button 
                            className="btn btn-sm text-white opacity-75 hover-opacity-100" 
                            onClick={() => setIsOpen(false)}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-grow-1 p-3 overflow-auto bg-light" style={{ fontSize: '14px' }}>
                        {messages.map(m => (
                            <div 
                                key={m.id} 
                                className={`d-flex flex-column mb-3 ${m.sender === 'user' ? 'align-items-end' : 'align-items-start'}`}
                            >
                                <div 
                                    className={`p-3 rounded-4 shadow-sm ${
                                        m.sender === 'user' 
                                            ? 'bg-primary text-white rounded-bottom-end-0' 
                                            : 'bg-white text-dark border rounded-bottom-start-0'
                                    }`}
                                    style={{ maxWidth: '88%', whiteSpace: 'pre-line', lineHeight: '1.5' }}
                                >
                                    {m.text}
                                </div>
                                {m.sender === 'ai' && (
                                    <div className="mt-1 d-flex gap-2">
                                        <button 
                                            className="btn btn-link btn-sm text-secondary p-0 small text-decoration-none"
                                            onClick={() => handleSpeak(m.text)}
                                        >
                                            🔊 Listen Aloud
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isThinking && (
                            <div className="d-flex align-items-center gap-2 text-secondary small p-2">
                                <div className="spinner-grow spinner-grow-sm text-primary" role="status"></div>
                                <span>Mentor is reflecting on Socratic guidance...</span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="p-2 bg-white border-top border-bottom d-flex gap-1 overflow-auto" style={{ whiteSpace: 'nowrap' }}>
                        <button 
                            className="btn btn-light btn-sm rounded-pill text-secondary border small px-2 py-1"
                            onClick={() => handleSend("Give me a hint for this module's exercise")}
                        >
                            💡 Need a Hint
                        </button>
                        <button 
                            className="btn btn-light btn-sm rounded-pill text-secondary border small px-2 py-1"
                            onClick={() => handleSend("Explain the core concept in simple terms")}
                        >
                            🔍 Explain Simply
                        </button>
                        <button 
                            className="btn btn-light btn-sm rounded-pill text-secondary border small px-2 py-1"
                            onClick={() => handleSend("How should I prepare for the Oral Viva?")}
                        >
                            🎙️ Viva Prep
                        </button>
                        <button 
                            className="btn btn-light btn-sm rounded-pill text-secondary border small px-2 py-1"
                            onClick={() => handleSend("Debug common errors in this code pattern")}
                        >
                            🐛 Debug Tips
                        </button>
                    </div>

                    {/* Chat Input Bar */}
                    <div className="p-3 bg-white">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
                            className="input-group"
                        >
                            <input 
                                type="text" 
                                className="form-control rounded-start-pill ps-3" 
                                placeholder="Ask your AI mentor a question..."
                                value={inputQuery}
                                onChange={(e) => setInputQuery(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                className="btn btn-primary rounded-end-pill px-3 fw-bold"
                                disabled={!inputQuery.trim()}
                            >
                                Send &rarr;
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIMentorDrawer;
