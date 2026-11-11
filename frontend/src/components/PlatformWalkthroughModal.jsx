import React, { useState, useEffect, useContext } from 'react';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { useNavigate } from 'react-router-dom';

const PlatformWalkthroughModal = () => {
    const { showWalkthrough, setShowWalkthrough, speak, stopSpeaking } = useContext(AccessibilityContext);
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [voiceMuted, setVoiceMuted] = useState(false);

    const steps = [
        {
            title: "Step 1: Student Login & Authentication",
            icon: "🔐",
            voice: "Welcome to LearnSphere Learning Management System. In Step 1, students sign in securely using their student email and password to access their personalized learning dashboard and track their academic progress.",
            description: "Enter your registered student credentials. For quick testing, use the pre-configured university account.",
            demoBox: {
                badge: "Authentication Portal",
                actionText: "Logging in as Student...",
                details: [
                    "Email: student@learnsphere.com",
                    "Password: •••••••• (Student@123)",
                    "Secure Bcrypt authentication verified ✓"
                ]
            }
        },
        {
            title: "Step 2: Explore & Enroll in Courses",
            icon: "📚",
            voice: "In Step 2, students browse the university course catalog. You can filter by categories like Web Development, Data Science, and Software Engineering, view comprehensive syllabi, and enroll with a single click.",
            description: "Browse university-grade courses with detailed module breakdowns, prerequisites, and learning objectives.",
            demoBox: {
                badge: "Course Catalog",
                actionText: "Enrolling in: Full Stack Web Development",
                details: [
                    "Curriculum: 4 Comprehensive Modules & 10 Lessons",
                    "Self-Paced Learning • Lifetime Access",
                    "Status: Successfully Enrolled (0% Initial Progress) ✓"
                ]
            }
        },
        {
            title: "Step 3: Coursera-Style Course Player & Lectures",
            icon: "🎥",
            voice: "In Step 3, the interactive learning space provides high-definition video walkthroughs, tabbed lecture notes, code snippets, and a curriculum checklist. Click Mark as Completed to automatically update your progress bar.",
            description: "Watch video tutorials, read comprehensive lesson notes, download reference cheatsheets, and mark lessons complete.",
            demoBox: {
                badge: "Interactive Course Player",
                actionText: "Lesson 1.1: Web Architecture & Semantic HTML5",
                details: [
                    "Video Lecture: High-definition tutorial player",
                    "Notes Tab: Formatted reading notes & code samples",
                    "Action: 'Mark as Completed & Continue' updates progress to 20% ✓"
                ]
            }
        },
        {
            title: "Step 4: Comprehensive Multi-Question Quizzes",
            icon: "📝",
            voice: "In Step 4, students test their understanding through multi-question interactive assessments. After submission, you receive an instant scorecard with educational explanations for every single question.",
            description: "Navigate through 10 conceptual multiple-choice questions, view question status, and review detailed answer explanations.",
            demoBox: {
                badge: "Academic Assessment",
                actionText: "Full Stack Certification Quiz (10 Questions)",
                details: [
                    "Passing Threshold: 70% Required",
                    "Question Jump Bar: Easily jump to questions 1 through 10",
                    "Educational Review: Explanations provided for each question ✓"
                ]
            }
        },
        {
            title: "Step 5: Verifiable Certificate of Completion",
            icon: "🏆",
            voice: "Finally, in Step 5, when you complete all course modules and pass the final assessment, LearnSphere automatically issues your official, verified Certificate of Completion with a unique credential ID and print-to-PDF support.",
            description: "Receive your official digital diploma featuring your name, course title, instructor verification, and print export.",
            demoBox: {
                badge: "Official Digital Credential",
                actionText: "Certificate Awarded: LearnSphere University",
                details: [
                    "Student: Alex Rivera (Jane Student)",
                    "Verification ID: LS-9F2B4D8A1C",
                    "Features: 1-Click Print & Save as PDF Support ✓"
                ]
            }
        }
    ];

    // Trigger voiceover whenever step changes if walkthrough is open and unmuted
    useEffect(() => {
        if (showWalkthrough && !voiceMuted) {
            speak(steps[currentStep].voice);
        } else {
            stopSpeaking();
        }
        return () => stopSpeaking();
    }, [currentStep, showWalkthrough, voiceMuted]);

    if (!showWalkthrough) return null;

    const current = steps[currentStep];

    const handleClose = () => {
        stopSpeaking();
        setShowWalkthrough(false);
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleGoToLogin = () => {
        handleClose();
        navigate('/login');
    };

    return (
        <div 
            className="modal show d-block" 
            tabIndex="-1" 
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    {/* Header with Accessibility Controls */}
                    <div className="modal-header bg-primary text-white p-3 p-md-4">
                        <div className="d-flex align-items-center">
                            <span className="fs-3 me-2">🎙️</span>
                            <div>
                                <h5 className="modal-title fw-bold mb-0">LearnSphere Interactive Video & Voice Walkthrough</h5>
                                <small className="text-light opacity-75">Demonstrating student login, learning player, quizzes, and certificates</small>
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                            <button 
                                className={`btn btn-sm ${voiceMuted ? 'btn-danger' : 'btn-light text-primary'} fw-bold`}
                                onClick={() => setVoiceMuted(!voiceMuted)}
                                title={voiceMuted ? "Unmute Voiceover" : "Mute Voiceover"}
                            >
                                {voiceMuted ? '🔇 Voice Muted' : '🔊 Voiceover ON'}
                            </button>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose} aria-label="Close"></button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="modal-body p-4 p-md-5 bg-light">
                        {/* Progress Stepper */}
                        <div className="d-flex justify-content-between mb-4">
                            {steps.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentStep(idx)}
                                    className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${
                                        idx === currentStep ? 'btn-primary shadow' : idx < currentStep ? 'btn-success' : 'btn-outline-secondary'
                                    }`}
                                >
                                    {idx + 1}. {s.icon}
                                </button>
                            ))}
                        </div>

                        {/* Step Details & Visual Simulation */}
                        <div className="card border-0 shadow-sm p-4 bg-white rounded-3 mb-4">
                            <div className="d-flex align-items-center mb-3">
                                <span className="display-6 me-3">{current.icon}</span>
                                <div>
                                    <h4 className="fw-bold text-dark mb-1">{current.title}</h4>
                                    <p className="text-secondary mb-0 small">{current.description}</p>
                                </div>
                            </div>

                            {/* Simulated Screen Box */}
                            <div className="p-3 rounded-3 bg-dark text-white font-monospace small border border-secondary">
                                <div className="d-flex justify-content-between align-items-center pb-2 mb-2 border-bottom border-secondary">
                                    <span className="badge bg-primary text-uppercase">{current.demoBox.badge}</span>
                                    <span className="text-success small">● Active Simulation</span>
                                </div>
                                <p className="text-info fw-bold mb-2">&gt; {current.demoBox.actionText}</p>
                                <ul className="list-unstyled mb-0 text-light opacity-90 ps-2">
                                    {current.demoBox.details.map((item, i) => (
                                        <li key={i} className="mb-1">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Accessibility Note */}
                        <div className="p-3 bg-primary-subtle rounded-3 text-primary-emphasis small d-flex align-items-center">
                            <span className="fs-5 me-2">♿</span>
                            <div>
                                <strong>Accessibility Feature:</strong> Full speech synthesis voiceover reads all instructions aloud for visually impaired and handicapped students.
                            </div>
                        </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="modal-footer bg-white p-3 d-flex justify-content-between flex-wrap gap-2">
                        <div className="d-flex gap-2">
                            <button 
                                className="btn btn-outline-secondary" 
                                disabled={currentStep === 0} 
                                onClick={handlePrev}
                            >
                                &larr; Previous Step
                            </button>
                            <button 
                                className="btn btn-outline-primary"
                                onClick={() => speak(current.voice)}
                                title="Replay voice narration"
                            >
                                🔁 Replay Voice
                            </button>
                        </div>

                        <div className="d-flex gap-2">
                            <button className="btn btn-success fw-bold px-3" onClick={handleGoToLogin}>
                                🚀 Go to Login & Try Now
                            </button>
                            <button className="btn btn-primary fw-bold px-4" onClick={handleNext}>
                                {currentStep === steps.length - 1 ? 'Finish Walkthrough ✓' : 'Next Step &rarr;'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformWalkthroughModal;
