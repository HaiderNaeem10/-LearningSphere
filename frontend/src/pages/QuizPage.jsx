import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { getCourseDetails, issueCertificate, sendCertificateEmail } from '../services/courseService';

const CircularProgressGauge = ({ percentage, isPassed }) => {
    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;
    const strokeColor = isPassed ? '#10b981' : '#ef4444';

    return (
        <div className="position-relative d-inline-flex align-items-center justify-content-center my-3">
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e2e8f0"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Value Stroke */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    style={{ transition: 'stroke-dashoffset 1.2s ease-in-out' }}
                />
            </svg>
            <div className="position-absolute text-center">
                <span className="display-5 fw-bold text-dark d-block lh-1">{percentage}%</span>
                <span className={`badge ${isPassed ? 'bg-success' : 'bg-danger'} mt-1`}>
                    {isPassed ? 'ACHIEVEMENT' : 'RETAKE REQUIRED'}
                </span>
            </div>
        </div>
    );
};

const QuizPage = () => {
    const { courseId } = useParams();
    const [searchParams] = useSearchParams();
    const quizIdParam = searchParams.get('quiz_id');

    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { speak, stopSpeaking, isSpeaking } = useContext(AccessibilityContext);

    const [courseDetails, setCourseDetails] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [skippedQuestions, setSkippedQuestions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    // Email dispatch state in results screen
    const [emailInput, setEmailInput] = useState(user?.email || 'student@learnsphere.com');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        const fetchAssessment = async () => {
            setLoading(true);
            try {
                // Load course details to evaluate module lock state
                const course = await getCourseDetails(courseId, user?.id);
                setCourseDetails(course);

                // If this is the final exam and it's locked, we don't need to fetch questions
                if (!quizIdParam && !course.is_final_unlocked) {
                    setLoading(false);
                    return;
                }

                // Try backend API first
                try {
                    let url = `/quizzes/details.php?course_id=${courseId}`;
                    if (quizIdParam) url += `&quiz_id=${quizIdParam}`;
                    const res = await api.get(url);
                    if (res.data && Array.isArray(res.data.questions) && res.data.questions.length > 0) {
                        setQuiz(res.data);
                        setLoading(false);
                        return;
                    }
                } catch {
                    // API offline, use robust template
                }

                // Fallback to course final exam or module quiz
                if (course.final_exam) {
                    setQuiz({
                        id: course.final_exam.id,
                        title: course.final_exam.title,
                        description: course.final_exam.description,
                        passing_percentage: course.final_exam.passing_percentage || 70,
                        questions: course.final_exam.questions.map(q => ({
                            id: q.id,
                            question_text: q.question,
                            marks: 1,
                            explanation: q.explanation,
                            options: q.options.map((opt, oIdx) => ({
                                id: oIdx,
                                option_text: opt,
                                is_correct: oIdx === q.correct ? 1 : 0
                            }))
                        }))
                    });
                }
            } catch (error) {
                console.error("Error fetching assessment:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssessment();
    }, [courseId, quizIdParam, user]);

    const handleOptionSelect = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
        setSkippedQuestions(prev => {
            const next = new Set(prev);
            next.delete(questionId);
            return next;
        });
    };

    const handleSkip = () => {
        if (!quiz?.questions) return;
        const currentQ = quiz.questions[activeQuestionIndex];
        if (currentQ) {
            setSkippedQuestions(prev => new Set(prev).add(currentQ.id));
        }
        if (activeQuestionIndex < quiz.questions.length - 1) {
            setActiveQuestionIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!quiz || !quiz.questions) return;

        const totalQuestions = quiz.questions.length;
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < totalQuestions) {
            const confirmSubmit = window.confirm(
                `You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit your final assessment now?`
            );
            if (!confirmSubmit) return;
        }

        setSubmitting(true);

        try {
            // Local calculation fallback
            let score = 0;
            const review = [];

            quiz.questions.forEach(q => {
                const userChoice = answers[q.id];
                const correctOpt = q.options.find(o => o.is_correct === 1);
                const isCorrect = userChoice !== undefined && userChoice === correctOpt?.id;
                if (isCorrect) score += (q.marks || 1);

                review.push({
                    question_id: q.id,
                    question_text: q.question_text,
                    marks: q.marks || 1,
                    explanation: q.explanation,
                    selected_option_id: userChoice,
                    correct_option_id: correctOpt?.id,
                    is_correct: isCorrect,
                    options: q.options
                });
            });

            const totalMarks = quiz.questions.reduce((acc, q) => acc + (q.marks || 1), 0);
            const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
            const passingPercentage = quiz.passing_percentage || 70;
            const isPassed = percentage >= passingPercentage;

            let certificateCode = null;
            if (isPassed) {
                const cert = await issueCertificate({
                    courseId,
                    student: user || { id: 'guest', name: 'Learner', email: emailInput },
                    percentage
                });
                certificateCode = cert.unique_code;
            }

            setResult({
                score,
                total_marks: totalMarks,
                percentage,
                passing_percentage: passingPercentage,
                is_passed: isPassed,
                certificate_code: certificateCode,
                review
            });

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Quiz evaluation error:', error);
            alert('Encountered an evaluation issue. Please retry.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Email Dispatch
    const handleSendCertificateEmail = async (e) => {
        e.preventDefault();
        setEmailError('');
        setEmailSuccess('');

        if (!emailInput || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
            setEmailError('Please enter an existing, valid email address.');
            return;
        }

        setSendingEmail(true);
        try {
            const res = await sendCertificateEmail(result.certificate_code, emailInput);
            setEmailSuccess(`✓ Certificate dispatched to ${emailInput}! Check your inbox for the verified credential.`);
        } catch (err) {
            setEmailError(err.message || 'Failed to dispatch email.');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="text-secondary">Loading comprehensive assessment &amp; verifying prerequisites...</p>
            </div>
        );
    }

    // ==========================================
    // LOCKED FINAL EXAM SCREEN
    // ==========================================
    if (courseDetails && !quizIdParam && !courseDetails.is_final_unlocked) {
        return (
            <div className="container py-5 text-center">
                <div className="card p-5 border-0 shadow-sm mx-auto rounded-4" style={{ maxWidth: '680px' }}>
                    <div className="display-3 mb-3">🔒</div>
                    <h3 className="fw-bold text-dark mb-2">Final Course Examination is Locked</h3>
                    <p className="lead text-secondary mb-3">
                        Pedagogical Mastery Requirement: You must complete and certify all prior curriculum modules (1.1, 1.2, 1.3, 1.4) before this examination unlocks.
                    </p>

                    <div className="p-3 bg-light rounded-3 border mb-4 text-start">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold text-dark">Course Curriculum Progress:</span>
                            <span className="badge bg-primary fs-6">{courseDetails.progress_percentage || 0}%</span>
                        </div>
                        <div className="progress mb-2" style={{ height: '10px' }}>
                            <div 
                                className="progress-bar bg-primary" 
                                role="progressbar" 
                                style={{ width: `${courseDetails.progress_percentage || 0}%` }}
                            ></div>
                        </div>
                        <small className="text-danger fw-semibold d-block">
                            ⚠️ {courseDetails.remaining_modules_for_final || 1} module(s) currently uncertified. Complete them in the Course Player to unlock the final test.
                        </small>
                    </div>

                    <div className="d-flex justify-content-center gap-3 flex-wrap">
                        <Link to={`/learn/${courseId}`} className="btn btn-primary fw-bold px-4 py-2 shadow-sm">
                            ▶️ Return to Course Player &amp; Finish Modules
                        </Link>
                        <Link to={`/courses/${courseId}`} className="btn btn-outline-secondary px-4 py-2">
                            Course Outline
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="container py-5 text-center">
                <div className="card p-5 border-0 shadow-sm mx-auto rounded-4" style={{ maxWidth: '600px' }}>
                    <div className="fs-1 mb-2">📋</div>
                    <h4 className="fw-bold">No Assessment Found</h4>
                    <p className="text-secondary">There are currently no active quizzes registered for this section.</p>
                    <Link to={`/courses/${courseId}`} className="btn btn-primary mt-3">Back to Course</Link>
                </div>
            </div>
        );
    }

    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

    // ==========================================
    // RESULT SCREEN
    // ==========================================
    if (result) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {/* Summary Header Card */}
                        <div className={`card border-0 shadow-sm mb-4 text-center p-4 p-md-5 rounded-4 ${
                            result.is_passed ? 'bg-success-subtle border-start border-success border-5' : 'bg-danger-subtle border-start border-danger border-5'
                        }`}>
                            <div className="display-4 mb-2">
                                {result.is_passed ? '🎓' : '📚'}
                            </div>
                            <h2 className="fw-bold mb-1">
                                {result.is_passed ? 'Congratulations! Examination Certified!' : 'Assessment Not Passed'}
                            </h2>
                            <p className="lead text-secondary mb-3">
                                {result.is_passed 
                                    ? `You scored ${result.percentage}%, successfully satisfying the required ${result.passing_percentage}% passing threshold.`
                                    : `You scored ${result.percentage}%. The passing threshold is ${result.passing_percentage}%. Review the educational solutions below and retake when ready.`}
                            </p>

                            <CircularProgressGauge percentage={result.percentage} isPassed={result.is_passed} />

                            <div className="d-flex justify-content-center gap-4 flex-wrap mb-4">
                                <div className="card p-3 border-0 shadow-sm bg-white rounded-3" style={{ minWidth: '150px' }}>
                                    <small className="text-secondary">Points Earned</small>
                                    <h3 className="fw-bold text-primary mb-0">{result.score} / {result.total_marks}</h3>
                                </div>
                                <div className="card p-3 border-0 shadow-sm bg-white rounded-3" style={{ minWidth: '150px' }}>
                                    <small className="text-secondary">Passing Threshold</small>
                                    <h3 className="fw-bold text-dark mb-0">{result.passing_percentage}%</h3>
                                </div>
                                <div className="card p-3 border-0 shadow-sm bg-white rounded-3" style={{ minWidth: '150px' }}>
                                    <small className="text-secondary">Accreditation Status</small>
                                    <h3 className={`fw-bold mb-0 ${result.is_passed ? 'text-success' : 'text-danger'}`}>
                                        {result.is_passed ? 'CERTIFIED' : 'NEEDS RETAKE'}
                                    </h3>
                                </div>
                            </div>

                            {/* Email Certificate Form */}
                            {result.is_passed && result.certificate_code && (
                                <div className="card p-4 border-0 shadow-sm bg-white rounded-4 mb-4 text-start">
                                    <h5 className="fw-bold text-primary mb-1">📧 Email Certificate to Existing Address</h5>
                                    <p className="text-secondary small mb-3">
                                        Send your official verified digital credential directly to your active email inbox.
                                    </p>
                                    <form onSubmit={handleSendCertificateEmail}>
                                        <div className="input-group">
                                            <input 
                                                type="email" 
                                                className="form-control" 
                                                placeholder="Enter student's verified email address..." 
                                                value={emailInput}
                                                onChange={(e) => setEmailInput(e.target.value)}
                                                required
                                            />
                                            <button 
                                                type="submit" 
                                                className="btn btn-success fw-bold px-4"
                                                disabled={sendingEmail}
                                            >
                                                {sendingEmail ? 'Dispatching...' : 'Email Certificate 🚀'}
                                            </button>
                                        </div>
                                        {emailError && <div className="alert alert-danger border-0 small mt-2 py-2">{emailError}</div>}
                                        {emailSuccess && <div className="alert alert-success border-0 small mt-2 py-2">{emailSuccess}</div>}
                                    </form>
                                </div>
                            )}

                            <div className="d-flex justify-content-center gap-3 flex-wrap">
                                {result.is_passed && result.certificate_code && (
                                    <Link to={`/certificate/${result.certificate_code}`} className="btn btn-success btn-lg px-4 fw-bold shadow">
                                        🏆 View Official Certificate
                                    </Link>
                                )}
                                <button 
                                    className="btn btn-outline-primary btn-lg px-4" 
                                    onClick={() => {
                                        setResult(null);
                                        setAnswers({});
                                        setSkippedQuestions(new Set());
                                        setActiveQuestionIndex(0);
                                    }}
                                >
                                    🔄 Retake Assessment
                                </button>
                                <Link to={`/learn/${courseId}`} className="btn btn-secondary btn-lg px-4">
                                    Return to Course Player
                                </Link>
                            </div>
                        </div>

                        {/* Detailed Question Review */}
                        <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
                            <h4 className="fw-bold mb-4">Question-by-Question Review &amp; Educational Feedback</h4>
                            {result.review && result.review.map((item, idx) => (
                                <div key={item.question_id} className={`p-4 mb-4 rounded-3 border ${
                                    item.is_correct ? 'border-success bg-white' : 'border-danger bg-white'
                                }`}>
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <h5 className="fw-bold mb-0 text-dark">
                                            {idx + 1}. {item.question_text}
                                        </h5>
                                        <span className={`badge ${item.is_correct ? 'bg-success' : 'bg-danger'} fs-6`}>
                                            {item.is_correct ? `✓ Correct (+${item.marks})` : '✗ Incorrect (0)'}
                                        </span>
                                    </div>

                                    <div className="list-group list-group-flush my-3">
                                        {item.options.map(opt => {
                                            const isUserChoice = item.selected_option_id === parseInt(opt.id);
                                            const isCorrectChoice = opt.is_correct == 1;

                                            let badgeClass = 'border-light bg-light text-dark';
                                            let icon = '';

                                            if (isCorrectChoice) {
                                                badgeClass = 'border-success bg-success-subtle text-success-emphasis fw-bold';
                                                icon = '✓ Correct Answer: ';
                                            } else if (isUserChoice && !isCorrectChoice) {
                                                badgeClass = 'border-danger bg-danger-subtle text-danger-emphasis';
                                                icon = '✗ Your Choice: ';
                                            }

                                            return (
                                                <div key={opt.id} className={`list-group-item rounded p-2 mb-1 ${badgeClass}`}>
                                                    {icon} {opt.option_text}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {item.explanation && (
                                        <div className="p-3 bg-primary-subtle rounded text-primary-emphasis small">
                                            <strong>💡 Educational Insight:</strong> {item.explanation}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // ACTIVE QUIZ INTERFACE
    // ==========================================
    const currentQ = quiz.questions[activeQuestionIndex];

    return (
        <div className="container py-4">
            <div className="card border-0 shadow-sm p-4 mb-4 bg-white rounded-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <span className="badge bg-primary mb-1">Official Course Assessment</span>
                        <h4 className="fw-bold mb-0 text-dark">{quiz.title}</h4>
                    </div>
                    <div className="text-end">
                        <span className="badge bg-light text-secondary border px-3 py-2">
                            Progress: {answeredCount} / {totalQuestions} Answered ({progressPercent}%)
                        </span>
                    </div>
                </div>
            </div>

            {currentQ && (
                <div className="card border-0 shadow-sm p-4 p-md-5 bg-white rounded-4 mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="badge bg-secondary-subtle text-secondary fs-6">
                            Question {activeQuestionIndex + 1} of {totalQuestions}
                        </span>
                    </div>

                    <h4 className="fw-bold text-dark mb-4">{currentQ.question_text}</h4>

                    <div className="d-flex flex-column gap-3 mb-4">
                        {currentQ.options.map(opt => {
                            const isSelected = answers[currentQ.id] === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                                    className={`btn text-start p-3 rounded-3 d-flex align-items-center border ${
                                        isSelected 
                                            ? 'btn-primary text-white fw-bold shadow-sm' 
                                            : 'btn-outline-light text-dark bg-light hover-shadow'
                                    }`}
                                >
                                    <span className={`badge me-3 rounded-circle p-2 ${isSelected ? 'bg-white text-primary' : 'bg-secondary text-white'}`}>
                                        {['A', 'B', 'C', 'D'][opt.id] || '•'}
                                    </span>
                                    <span className="fs-6">{opt.option_text}</span>
                                </button>
                            );
                        })}
                    </div>

                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-3 border-top">
                        <button 
                            className="btn btn-outline-secondary"
                            disabled={activeQuestionIndex === 0}
                            onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                        >
                            &larr; Previous Question
                        </button>

                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-warning" onClick={handleSkip}>
                                Skip for Now
                            </button>
                            {activeQuestionIndex < totalQuestions - 1 ? (
                                <button 
                                    className="btn btn-primary px-4 fw-bold shadow-sm"
                                    onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                                >
                                    Next Question &rarr;
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-success px-4 fw-bold shadow-sm"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : 'Submit & Certify Assessment ✓'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizPage;
