import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { AccessibilityContext } from '../context/AccessibilityContext';

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

    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [skippedQuestions, setSkippedQuestions] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchQuiz = async () => {
            try {
                let url = `/quizzes/details.php?course_id=${courseId}`;
                if (quizIdParam) {
                    url += `&quiz_id=${quizIdParam}`;
                }
                const response = await api.get(url);
                setQuiz(response.data);
            } catch (error) {
                console.error("Error fetching quiz", error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [courseId, quizIdParam, user, navigate]);

    const handleOptionSelect = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId
        }));
        // Remove from skipped set if selected
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
                `You have answered ${answeredCount} of ${totalQuestions} questions (${totalQuestions - answeredCount} unanswered or skipped). Are you sure you want to submit your final assessment now?`
            );
            if (!confirmSubmit) return;
        }

        setSubmitting(true);
        const formattedAnswers = Object.keys(answers).map(qId => ({
            question_id: parseInt(qId),
            option_id: parseInt(answers[qId])
        }));

        try {
            const response = await api.post('/quizzes/submit.php', {
                quiz_id: quiz.id,
                student_id: user.id,
                answers: formattedAnswers
            });
            setResult(response.data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            alert('Failed to submit quiz. Please verify your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <p className="text-secondary">Loading Coursera-style assessment...</p>
            </div>
        );
    }

    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="container py-5 text-center">
                <div className="card p-5 border-0 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                    <div className="fs-1 mb-2">📋</div>
                    <h4>No Assessment Found</h4>
                    <p className="text-secondary">There are currently no active quizzes registered for this course.</p>
                    <Link to={`/courses/${courseId}`} className="btn btn-primary mt-3">Back to Course</Link>
                </div>
            </div>
        );
    }

    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

    // ==========================================
    // RESULT SCREEN (Circular Gauge, Scorecard, Review & Certificate)
    // ==========================================
    if (result) {
        return (
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-lg-10">
                        {/* Summary Header Card with Circular Gauge */}
                        <div className={`card border-0 shadow-sm mb-4 text-center p-4 p-md-5 ${
                            result.is_passed ? 'bg-success-subtle border-start border-success border-5' : 'bg-danger-subtle border-start border-danger border-5'
                        }`}>
                            <div className="display-4 mb-2">
                                {result.is_passed ? '🎓' : '📚'}
                            </div>
                            <h2 className="fw-bold mb-1">
                                {result.is_passed ? 'Congratulations! Assessment Completed!' : 'Assessment Not Passed'}
                            </h2>
                            <p className="lead text-secondary mb-3">
                                {result.is_passed 
                                    ? `You scored ${result.percentage}%, successfully satisfying the required ${result.passing_percentage}% passing threshold.`
                                    : `You scored ${result.percentage}%. The passing threshold is ${result.passing_percentage}%. Review the questions below and retake when ready.`}
                            </p>

                            {/* Circular Achievement Gauge */}
                            <CircularProgressGauge percentage={result.percentage} isPassed={result.is_passed} />

                            <div className="d-flex justify-content-center gap-4 flex-wrap mb-4">
                                <div className="card p-3 border-0 shadow-sm bg-white rounded-3" style={{ minWidth: '150px' }}>
                                    <small className="text-secondary">Points Earned</small>
                                    <h3 className="fw-bold text-primary mb-0">{result.score} / {result.total_marks}</h3>
                                </div>
                                <div className="card p-3 border-0 shadow-sm bg-white rounded-3" style={{ minWidth: '150px' }}>
                                    <small className="text-secondary">Passing Mark</small>
                                    <h3 className="fw-bold text-dark mb-0">{result.passing_percentage}%</h3>
                                </div>
                                <div className="card p-3 border-0 shadow-sm bg-white rounded-3" style={{ minWidth: '150px' }}>
                                    <small className="text-secondary">Final Status</small>
                                    <h3 className={`fw-bold mb-0 ${result.is_passed ? 'text-success' : 'text-danger'}`}>
                                        {result.is_passed ? 'PASSED' : 'NEEDS RETAKE'}
                                    </h3>
                                </div>
                            </div>

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
                                    🔄 Retake Quiz
                                </button>
                                <Link to={`/learn/${courseId}`} className="btn btn-secondary btn-lg px-4">
                                    Return to Lessons
                                </Link>
                            </div>
                        </div>

                        {/* Detailed Question Review with Educational Explanations */}
                        <div className="card border-0 shadow-sm p-4">
                            <h4 className="fw-bold mb-4">Question-by-Question Review &amp; Educational Feedback</h4>
                            {result.review && result.review.map((item, idx) => (
                                <div key={item.question_id} className={`p-4 mb-4 rounded border ${
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

                                    {/* Options breakdown */}
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

                                    {/* Educational Explanation Box */}
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
            {/* Top Assessment Header */}
            <div className="card border-0 shadow-sm p-4 mb-4 bg-white">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <Link to={`/learn/${courseId}`} className="text-decoration-none text-secondary small">
                            &larr; Back to Course Player
                        </Link>
                        <h3 className="fw-bold text-dark mt-1 mb-0">{quiz.title}</h3>
                        <small className="text-secondary">
                            Passing Threshold: <strong>{quiz.passing_percentage}%</strong> • Total Questions: <strong>{totalQuestions}</strong>
                        </small>
                    </div>

                    <div className="text-end" style={{ minWidth: '180px' }}>
                        <div className="d-flex justify-content-between small fw-bold mb-1">
                            <span>Answered</span>
                            <span>{answeredCount} / {totalQuestions}</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Quick Question Jump Strip */}
                <hr className="my-3" />
                <div className="d-flex gap-2 flex-wrap align-items-center">
                    <span className="small text-secondary fw-semibold me-2">Jump to:</span>
                    {quiz.questions.map((q, idx) => {
                        const isAnswered = answers[q.id] !== undefined;
                        const isSkipped = skippedQuestions.has(q.id);
                        const isCurrent = idx === activeQuestionIndex;

                        let btnClass = 'btn-outline-secondary';
                        if (isCurrent) btnClass = 'btn-primary fw-bold';
                        else if (isAnswered) btnClass = 'btn-success text-white';
                        else if (isSkipped) btnClass = 'btn-warning text-dark';

                        return (
                            <button
                                key={q.id}
                                onClick={() => setActiveQuestionIndex(idx)}
                                className={`btn btn-sm ${btnClass}`}
                                style={{ width: '38px', height: '36px' }}
                                title={`Question ${idx + 1}${isAnswered ? ' (Answered)' : isSkipped ? ' (Skipped)' : ''}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Question Card */}
            {currentQ && (
                <div className="card border-0 shadow-sm p-4 p-md-5 mb-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary px-3 py-2 fs-6">
                                Question {activeQuestionIndex + 1} of {totalQuestions}
                            </span>
                            <span className="badge bg-secondary-subtle text-secondary px-3 py-2">
                                {currentQ.marks} Marks
                            </span>
                            {skippedQuestions.has(currentQ.id) && (
                                <span className="badge bg-warning text-dark px-2 py-1">
                                    Skipped
                                </span>
                            )}
                        </div>
                        <div>
                            {isSpeaking ? (
                                <button 
                                    className="btn btn-danger btn-sm fw-bold px-3 shadow-sm"
                                    onClick={stopSpeaking}
                                >
                                    ⏹️ Stop Voice
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-outline-primary btn-sm fw-bold px-3 shadow-sm"
                                    onClick={() => {
                                        const optString = currentQ.options.map((o, idx) => `Choice ${idx + 1}: ${o.option_text}`).join('. ');
                                        speak(`Question ${activeQuestionIndex + 1}: ${currentQ.text}. ${optString}`);
                                    }}
                                >
                                    🔊 Listen to Question & Choices
                                </button>
                            )}
                        </div>
                    </div>

                    <h4 className="fw-bold text-dark mb-4 lh-base">
                        {currentQ.text}
                    </h4>

                    {/* Radio Options */}
                    <div className="d-flex flex-column gap-3 mb-4">
                        {currentQ.options.map(opt => {
                            const isSelected = answers[currentQ.id] === opt.id;
                            return (
                                <label 
                                    key={opt.id}
                                    onClick={() => handleOptionSelect(currentQ.id, opt.id)}
                                    className={`p-3 rounded-3 border d-flex align-items-center cursor-pointer transition-hover ${
                                        isSelected ? 'border-primary bg-primary-subtle text-primary fw-semibold' : 'border-light-subtle bg-light text-dark'
                                    }`}
                                    style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                                >
                                    <input 
                                        type="radio"
                                        name={`question_${currentQ.id}`}
                                        checked={isSelected}
                                        onChange={() => handleOptionSelect(currentQ.id, opt.id)}
                                        className="form-check-input me-3 fs-5"
                                    />
                                    <span className="fs-6">{opt.option_text}</span>
                                </label>
                            );
                        })}
                    </div>

                    {/* Question Action Navigation with Skip, Next & Previous */}
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2">
                        <button 
                            className="btn btn-outline-secondary"
                            disabled={activeQuestionIndex === 0}
                            onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                        >
                            &larr; Previous
                        </button>

                        <div className="d-flex gap-2">
                            {/* Skip Question Option */}
                            {activeQuestionIndex < totalQuestions - 1 && (
                                <button 
                                    className="btn btn-outline-warning text-dark px-3 fw-semibold"
                                    onClick={handleSkip}
                                >
                                    ⏭️ Skip Question
                                </button>
                            )}

                            {activeQuestionIndex < totalQuestions - 1 ? (
                                <button 
                                    className="btn btn-primary px-4 fw-bold"
                                    onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                                >
                                    Next Question &rarr;
                                </button>
                            ) : (
                                <button 
                                    className="btn btn-success btn-lg px-5 fw-bold shadow"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : '✓ Submit Final Quiz'}
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
