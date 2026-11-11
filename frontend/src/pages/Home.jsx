import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AccessibilityContext } from '../context/AccessibilityContext';

const Home = () => {
    const { setShowWalkthrough, toggleVoiceOver, voiceOverEnabled, speak } = useContext(AccessibilityContext);

    return (
        <div className="container py-4">
            {/* Hero Section */}
            <div className="hero-section text-center p-5 rounded-4 shadow-sm mb-5 bg-white border border-primary-subtle position-relative overflow-hidden">
                <div className="d-flex justify-content-center gap-2 mb-3 flex-wrap">
                    <span className="badge bg-primary-subtle text-primary px-3 py-2 fs-6">
                        🎓 University Level LMS Platform
                    </span>
                    <span className="badge bg-success-subtle text-success px-3 py-2 fs-6">
                        ♿ Voiceover & Accessibility Enabled
                    </span>
                </div>

                <h1 className="hero-title fw-bold text-dark display-4 mb-3">
                    Learn Today. Build Tomorrow.
                </h1>
                <p className="hero-subtitle text-secondary fs-5 col-md-9 mx-auto mb-4">
                    Master engineering concepts through video lectures, Coursera-style curriculum checklists, interactive quizzes with explanations, and verified certificates.
                </p>

                {/* Hero Buttons: Including Walkthrough & Voiceover */}
                <div className="d-flex justify-content-center gap-3 flex-wrap mb-3">
                    <button 
                        className="btn btn-warning btn-lg px-4 fw-bold shadow-sm d-flex align-items-center"
                        onClick={() => setShowWalkthrough(true)}
                    >
                        <span className="me-2">🎥</span> Watch Platform Video & Voice Walkthrough
                    </button>
                    <Link to="/courses" className="btn btn-primary btn-lg px-4 shadow-sm fw-bold">
                        Explore Courses
                    </Link>
                    <Link to="/register" className="btn btn-outline-primary btn-lg px-4 fw-semibold">
                        Get Started Free
                    </Link>
                </div>

                {/* Quick Accessibility helper hint */}
                <small className="text-muted d-block mt-2">
                    🎙️ Visually impaired or blind students? Click the floating <strong>♿ Accessibility</strong> icon anytime or turn on 
                    <button 
                        className="btn btn-link btn-sm p-0 ms-1 fw-bold text-primary text-decoration-none"
                        onClick={toggleVoiceOver}
                    >
                        Voiceover Mode ({voiceOverEnabled ? 'Active' : 'Enable'})
                    </button>.
                </small>
            </div>

            {/* Quick Stats */}
            <div className="row g-4 text-center mb-5">
                <div className="col-6 col-md-3">
                    <div className="card p-4 shadow-sm border-0 h-100 bg-white">
                        <h2 className="fw-bold text-primary mb-1">4+</h2>
                        <span className="text-secondary small">Specialized Tracks</span>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card p-4 shadow-sm border-0 h-100 bg-white">
                        <h2 className="fw-bold text-success mb-1">100%</h2>
                        <span className="text-secondary small">Self-Paced & Accessible</span>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card p-4 shadow-sm border-0 h-100 bg-white">
                        <h2 className="fw-bold text-warning mb-1">15+</h2>
                        <span className="text-secondary small">Interactive Quiz Questions</span>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card p-4 shadow-sm border-0 h-100 bg-white">
                        <h2 className="fw-bold text-info mb-1">Verifiable</h2>
                        <span className="text-secondary small">Digital Certificates</span>
                    </div>
                </div>
            </div>

            {/* Accessibility Priority Section */}
            <div className="card border-0 shadow-sm p-4 p-md-5 mb-5 bg-primary-subtle border-start border-primary border-5 rounded-4">
                <div className="row align-items-center">
                    <div className="col-lg-8">
                        <span className="badge bg-primary text-white mb-2 px-3 py-1">Universal Inclusion</span>
                        <h3 className="fw-bold text-dark mb-2">Designed for Accessibility & Speech Voiceover</h3>
                        <p className="text-secondary mb-3">
                            LearnSphere empowers visually impaired, blind, and motor-handicapped students with integrated Text-to-Speech (TTS) voice reading, lecture audio playback, quiz read-aloud support, high-contrast dark mode, and dynamic text scaling.
                        </p>
                        <div className="d-flex gap-2 flex-wrap">
                            <button 
                                className={`btn btn-sm ${voiceOverEnabled ? 'btn-success' : 'btn-primary'} fw-bold px-3`}
                                onClick={toggleVoiceOver}
                            >
                                🔊 {voiceOverEnabled ? 'Voiceover Reader Active' : 'Activate Voiceover Reader'}
                            </button>
                            <button 
                                className="btn btn-outline-primary btn-sm fw-bold px-3"
                                onClick={() => speak("LearnSphere is dedicated to universal education, ensuring blind and handicapped students have first-class voiceover and screen reading support.")}
                            >
                                🗣️ Test Audio Voice
                            </button>
                            <button 
                                className="btn btn-warning btn-sm fw-bold px-3"
                                onClick={() => setShowWalkthrough(true)}
                            >
                                🎥 Open Voice Guided Walkthrough
                            </button>
                        </div>
                    </div>
                    <div className="col-lg-4 text-center mt-4 mt-lg-0">
                        <div className="display-1">♿ 🎙️</div>
                        <small className="text-muted fw-bold d-block mt-2">WCAG Accessible Architecture</small>
                    </div>
                </div>
            </div>

            {/* Key Features */}
            <div className="row g-4 mb-5">
                <div className="col-md-4">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white">
                        <div className="mb-3 text-primary fs-2">📚</div>
                        <h4 className="fw-bold mb-2">Coursera-Style Curriculum</h4>
                        <p className="text-secondary">
                            Structured modules with video walkthroughs, tabbed lecture notes, downloadable cheatsheets, and student discussions.
                        </p>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white">
                        <div className="mb-3 text-success fs-2">📝</div>
                        <h4 className="fw-bold mb-2">Multi-Question Assessments</h4>
                        <p className="text-secondary">
                            Test knowledge with 10-question conceptual exams featuring instant scoring and detailed educational explanations.
                        </p>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card h-100 p-4 border-0 shadow-sm bg-white">
                        <div className="mb-3 text-warning fs-2">🏆</div>
                        <h4 className="fw-bold mb-2">Printable Credentials</h4>
                        <p className="text-secondary">
                            Track progress from 0% to 100% and earn an official verified certificate with unique validation IDs.
                        </p>
                    </div>
                </div>
            </div>

            {/* Call To Action */}
            <div className="card bg-dark text-white p-5 border-0 shadow text-center mb-4 rounded-4">
                <h3 className="fw-bold mb-2">Ready to level up your engineering skills?</h3>
                <p className="text-light opacity-75 mb-4">Join hundreds of students and start your learning journey today.</p>
                <div>
                    <Link to="/register" className="btn btn-light btn-lg px-4 fw-bold me-2">Create Student Account</Link>
                    <Link to="/courses" className="btn btn-outline-light btn-lg px-4">Browse Catalog</Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
