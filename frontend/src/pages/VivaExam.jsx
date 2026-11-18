import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import speechService from '../services/speechService';
import { VIVA_CURRICULUM_POOLS, evaluateVivaResponse } from '../services/aiMentorService';
import { getCourseDetails, issueCertificate, sendCertificateEmail } from '../services/courseService';

const VivaExam = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [questionList, setQuestionList] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);

    // Audio & Speech Recognition State
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recognitionSupported, setRecognitionSupported] = useState(true);

    // Evaluation & Results State
    const [currentEvaluation, setCurrentEvaluation] = useState(null);
    const [isFollowUpPhase, setIsFollowUpPhase] = useState(false);
    const [evaluating, setEvaluating] = useState(false);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [vivaComplete, setVivaComplete] = useState(false);

    // Certificate & Email
    const [certificateCode, setCertificateCode] = useState(null);
    const [emailRecipient, setEmailRecipient] = useState(user?.email || 'student@learnsphere.com');
    const [emailStatus, setEmailStatus] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);

    const recognitionRef = useRef(null);

    // Subscribe to TTS state
    useEffect(() => {
        const unsubscribe = speechService.subscribe(setIsAiSpeaking);
        return () => {
            unsubscribe();
            speechService.stop();
        };
    }, []);

    // Initialize Web Speech Recognition
    useEffect(() => {
        const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                let currentText = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentText += event.results[i][0].transcript;
                }
                setTranscript(prev => (prev ? prev + ' ' : '') + currentText);
            };

            recognition.onerror = (event) => {
                console.warn('SpeechRecognition error:', event.error);
                setIsListening(false);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setRecognitionSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
            }
        };
    }, []);

    // Load Course & Viva Questions
    useEffect(() => {
        const initViva = async () => {
            setLoading(true);
            try {
                const cData = await getCourseDetails(courseId, user?.id);
                setCourse(cData);

                const numericId = parseInt(courseId, 10) || 1;
                const pool = VIVA_CURRICULUM_POOLS[numericId] || VIVA_CURRICULUM_POOLS[1];
                setQuestionList(pool);
                setCurrentQuestion(pool[0]);
            } catch (e) {
                console.error("Viva init error:", e);
            } finally {
                setLoading(false);
            }
        };

        initViva();
    }, [courseId, user]);

    // Speak Question Aloud when loaded or changed
    useEffect(() => {
        if (currentQuestion && !vivaComplete) {
            const textToSpeak = isFollowUpPhase 
                ? `Follow-up question: ${currentEvaluation?.followUpPrompt || 'Can you elaborate further?'}`
                : `Question ${currentIndex + 1}: ${currentQuestion.question}`;
            
            speechService.speak(textToSpeak);
        }
    }, [currentQuestion, currentIndex, isFollowUpPhase]);

    // Handle Microphone Toggle
    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            speechService.stop();
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (err) {
                console.warn("Speech start issue:", err);
            }
        }
    };

    // Evaluate Answer
    const handleEvaluateAnswer = async () => {
        if (!transcript.trim()) {
            alert('Please speak into the microphone or type your response before submitting.');
            return;
        }

        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        setEvaluating(true);
        speechService.stop();

        setTimeout(async () => {
            const evalResult = evaluateVivaResponse(currentQuestion, transcript);
            setCurrentEvaluation(evalResult);
            setEvaluating(false);

            // Announce evaluation score via voice
            speechService.speak(`Evaluation: ${evalResult.grade}. Score: ${evalResult.score} percent. ${evalResult.feedback}`);

            // If question has a follow-up and student scored < 80, give one follow-up chance
            if (evalResult.needsFollowUp && !isFollowUpPhase) {
                setIsFollowUpPhase(true);
                setTranscript('');
            }
        }, 1200);
    };

    // Proceed to Next Question
    const handleNextQuestion = async () => {
        speechService.stop();
        
        // Save current question record
        const record = {
            question: currentQuestion.question,
            moduleCode: currentQuestion.moduleCode,
            topic: currentQuestion.topic,
            studentAnswer: transcript,
            score: currentEvaluation?.score || 75,
            grade: currentEvaluation?.grade || 'Proficient',
            feedback: currentEvaluation?.feedback || 'Good articulation of core mechanisms.'
        };

        const updatedAnswers = [...answeredQuestions, record];
        setAnsweredQuestions(updatedAnswers);

        setTranscript('');
        setCurrentEvaluation(null);
        setIsFollowUpPhase(false);

        if (currentIndex < questionList.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setCurrentQuestion(questionList[nextIdx]);
        } else {
            // Completed All Viva Questions!
            setVivaComplete(true);
            const totalScore = Math.round(updatedAnswers.reduce((a, b) => a + b.score, 0) / updatedAnswers.length);
            
            // Issue official credential if average score >= 65
            if (totalScore >= 65) {
                try {
                    const cert = await issueCertificate({
                        courseId,
                        student: user || { id: 'guest', name: 'Student Learner', email: emailRecipient },
                        percentage: totalScore
                    });
                    setCertificateCode(cert.unique_code);
                } catch (e) {
                    console.error('Cert issuance error:', e);
                }
            }

            speechService.speak(`Congratulations! You have completed the oral viva examination with a final score of ${totalScore} percent.`);
        }
    };

    // Send Certificate via Email
    const handleSendVivaEmail = async (e) => {
        e.preventDefault();
        setEmailStatus('');
        if (!emailRecipient || !emailRecipient.includes('@')) {
            alert('Please provide a valid, existing email address.');
            return;
        }

        setSendingEmail(true);
        try {
            const res = await sendCertificateEmail(certificateCode || 'LS-VIVA-CREDENTIAL', emailRecipient);
            setEmailStatus(`✓ Viva Credentials & Certificate successfully dispatched to ${emailRecipient}!`);
        } catch (err) {
            setEmailStatus(`Failed to send email: ${err.message}`);
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <h5 className="text-secondary">Initializing AI Oral Examination Room &amp; Voice Synthesis...</h5>
            </div>
        );
    }

    const avgScore = answeredQuestions.length > 0 
        ? Math.round(answeredQuestions.reduce((a, b) => a + b.score, 0) / answeredQuestions.length)
        : 85;

    return (
        <div className="container py-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <Link to={`/learn/${courseId}`} className="text-decoration-none text-secondary small fw-bold">
                        &larr; Back to Course Player
                    </Link>
                    <h2 className="fw-bold text-dark mb-0 mt-1">🎙️ AI Oral Viva Examination (Voce)</h2>
                    <p className="text-secondary small mb-0">{course?.title || 'Academic Certification'}</p>
                </div>
                <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary px-3 py-2">
                        Oral Question {vivaComplete ? questionList.length : currentIndex + 1} of {questionList.length}
                    </span>
                    {isAiSpeaking && (
                        <span className="badge bg-danger animate-pulse px-3 py-2">
                            🔊 AI Examiner Speaking...
                        </span>
                    )}
                </div>
            </div>

            {!vivaComplete ? (
                <div className="row g-4">
                    {/* Left: AI Examiner Room & Voice Controls */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4 bg-white mb-4 position-relative overflow-hidden">
                            {/* Decorative Examiner Avatar */}
                            <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3 border">
                                <div className="display-6">🤖</div>
                                <div>
                                    <h5 className="fw-bold text-dark mb-0">LearnSphere AI Academic Examiner</h5>
                                    <small className="text-muted">
                                        Topic: <strong>Module {currentQuestion?.moduleCode} — {currentQuestion?.topic}</strong>
                                    </small>
                                </div>
                                <button 
                                    className="btn btn-outline-primary btn-sm ms-auto fw-bold"
                                    onClick={() => speechService.speak(isFollowUpPhase ? currentEvaluation?.followUpPrompt : currentQuestion?.question)}
                                >
                                    🔊 Re-read Question
                                </button>
                            </div>

                            {/* Current Question Display */}
                            <div className="p-4 bg-primary-subtle rounded-4 mb-4 border border-primary-subtle">
                                <span className="badge bg-primary mb-2">
                                    {isFollowUpPhase ? '⚠️ Examiner Counter-Question' : `Question ${currentIndex + 1}`}
                                </span>
                                <h4 className="fw-bold text-dark mb-0 lh-base">
                                    {isFollowUpPhase ? currentEvaluation?.followUpPrompt : currentQuestion?.question}
                                </h4>
                            </div>

                            {/* Student Speech-to-Text Input Area */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label small fw-bold text-secondary mb-0">
                                        Your Spoken / Typed Answer:
                                    </label>
                                    {recognitionSupported && (
                                        <button 
                                            className={`btn btn-sm ${isListening ? 'btn-danger animate-pulse' : 'btn-outline-danger'} fw-bold px-3 shadow-sm`}
                                            onClick={toggleListening}
                                        >
                                            {isListening ? '⏹️ Stop Microphone' : '🎙️ Speak with Microphone'}
                                        </button>
                                    )}
                                </div>

                                <textarea 
                                    className="form-control p-3 rounded-3"
                                    rows="5"
                                    placeholder={recognitionSupported ? "Click 'Speak with Microphone' or type your oral explanation here in detail..." : "Type your oral explanation here..."}
                                    value={transcript}
                                    onChange={(e) => setTranscript(e.target.value)}
                                ></textarea>
                                {isListening && (
                                    <small className="text-danger fw-semibold d-block mt-1">
                                        ● Listening to your voice in real time... Speak naturally.
                                    </small>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 border-top">
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => setTranscript('')}
                                >
                                    Clear Input
                                </button>

                                <div className="d-flex gap-2">
                                    {!currentEvaluation ? (
                                        <button 
                                            className="btn btn-primary fw-bold px-4 shadow-sm"
                                            onClick={handleEvaluateAnswer}
                                            disabled={evaluating || !transcript.trim()}
                                        >
                                            {evaluating ? 'Analyzing Technical Depth...' : 'Submit Oral Answer for Evaluation ✓'}
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn-success fw-bold px-4 shadow-sm"
                                            onClick={handleNextQuestion}
                                        >
                                            {currentIndex < questionList.length - 1 ? 'Next Question &rarr;' : 'Finish Viva & Generate Credentials &rarr;'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Live Viva Scorecard & Keyword Telemetry */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white mb-4">
                            <h5 className="fw-bold text-dark mb-3">📊 Real-Time Viva Evaluation Rubric</h5>
                            
                            {currentEvaluation ? (
                                <div>
                                    <div className="p-3 rounded-3 border mb-3 bg-light text-center">
                                        <small className="text-muted text-uppercase fw-bold">Answer Grade</small>
                                        <h2 className={`fw-bold mb-0 ${currentEvaluation.score >= 80 ? 'text-success' : currentEvaluation.score >= 65 ? 'text-primary' : 'text-warning'}`}>
                                            {currentEvaluation.grade} ({currentEvaluation.score}%)
                                        </h2>
                                    </div>

                                    <div className="mb-3">
                                        <strong className="d-block small text-dark mb-1">Examiner Feedback:</strong>
                                        <p className="text-secondary small bg-light p-3 rounded-3 border mb-0">
                                            {currentEvaluation.feedback}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <strong className="d-block small text-dark mb-1">Technical Terminology Recognized:</strong>
                                        <div className="d-flex gap-1 flex-wrap">
                                            {currentEvaluation.matchedKeywords.length > 0 ? (
                                                currentEvaluation.matchedKeywords.map((kw, i) => (
                                                    <span key={i} className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">
                                                        ✓ {kw}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted small">No specific core keywords detected.</span>
                                            )}
                                        </div>
                                    </div>

                                    {currentEvaluation.needsFollowUp && isFollowUpPhase && (
                                        <div className="alert alert-warning border-0 small mb-0">
                                            <strong>Counter-question active:</strong> Address the follow-up question on the left to elevate your score.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-5 text-secondary">
                                    <div className="fs-1 mb-2">⚖️</div>
                                    <h6 className="fw-bold">Awaiting Student Response</h6>
                                    <p className="small mb-0">
                                        Speak or type your answer to receive immediate real-time feedback on concept depth and keyword precision.
                                    </p>
                                </div>
                            )}

                            <hr className="my-4" />

                            {/* Completed Questions History */}
                            <h6 className="fw-bold text-dark mb-2">Previous Answers in this Session:</h6>
                            {answeredQuestions.length > 0 ? (
                                <ul className="list-group list-group-flush rounded-3 border">
                                    {answeredQuestions.map((q, idx) => (
                                        <li key={idx} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 small">
                                            <span className="text-truncate me-2">Module {q.moduleCode}: {q.topic}</span>
                                            <span className={`badge ${q.score >= 80 ? 'bg-success' : 'bg-primary'}`}>{q.score}%</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <small className="text-muted">No completed questions yet.</small>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Viva Completion Card & Official Endorsement */
                <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4 bg-white text-center mx-auto" style={{ maxWidth: '840px' }}>
                    <div className="display-4 text-success mb-2">🎓</div>
                    <h2 className="fw-bold text-dark mb-1">Oral Viva Voce Certified!</h2>
                    <p className="lead text-secondary mb-4">
                        You have successfully defended your technical understanding across all curriculum modules in <strong>{course?.title}</strong>.
                    </p>

                    <div className="row g-3 justify-content-center mb-4">
                        <div className="col-md-4">
                            <div className="card p-3 bg-light border-0 rounded-3">
                                <small className="text-muted">Final Viva Score</small>
                                <h2 className="fw-bold text-success mb-0">{avgScore}%</h2>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="card p-3 bg-light border-0 rounded-3">
                                <small className="text-muted">Academic Status</small>
                                <h2 className="fw-bold text-primary mb-0">{avgScore >= 80 ? 'High Distinction' : 'Accredited Pass'}</h2>
                            </div>
                        </div>
                    </div>

                    {/* Email Viva Credential */}
                    <div className="card p-4 border-0 bg-primary-subtle rounded-4 text-start mb-4">
                        <h5 className="fw-bold text-primary mb-1">📧 Dispatch Oral Viva Credential to Existing Email</h5>
                        <p className="text-secondary small mb-3">
                            Confirm your email address below to receive an authenticated PDF copy of your Viva examination report.
                        </p>
                        <form onSubmit={handleSendVivaEmail}>
                            <div className="input-group">
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder="Enter your existing verified email address..." 
                                    value={emailRecipient}
                                    onChange={(e) => setEmailRecipient(e.target.value)}
                                    required
                                />
                                <button 
                                    type="submit" 
                                    className="btn btn-primary fw-bold px-4"
                                    disabled={sendingEmail}
                                >
                                    {sendingEmail ? 'Sending...' : 'Email Viva Certificate 🚀'}
                                </button>
                            </div>
                            {emailStatus && (
                                <div className="alert alert-success border-0 small mt-2 py-2 mb-0">
                                    {emailStatus}
                                </div>
                            )}
                        </form>
                    </div>

                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        {certificateCode && (
                            <Link to={`/certificate/${certificateCode}`} className="btn btn-success btn-lg px-4 fw-bold shadow">
                                🏆 View Official Academic Certificate
                            </Link>
                        )}
                        <Link to={`/learn/${courseId}`} className="btn btn-outline-primary btn-lg px-4">
                            Return to Course Player
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VivaExam;
