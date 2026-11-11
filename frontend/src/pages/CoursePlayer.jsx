import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { useTranslation } from '../context/LanguageContext';

const CoursePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { speak, stopSpeaking, isSpeaking } = useContext(AccessibilityContext);
    const { t } = useTranslation();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [completedLessonIds, setCompletedLessonIds] = useState([]);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'interactive', 'quiz_check', 'assignments', 'resources', 'announcements'
    const [markingComplete, setMarkingComplete] = useState(false);

    // Interactive Code Sandbox State
    const [sandboxCode, setSandboxCode] = useState(`<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f0fdf4; color: #166534; }
    h2 { margin-top: 0; color: #15803d; }
    .badge { background: #22c55e; color: white; padding: 4px 10px; border-radius: 99px; }
  </style>
</head>
<body>
  <h2>Interactive Code Sandbox 🚀</h2>
  <p>Modify this code and click <strong>Run Code</strong> to see the live output below!</p>
  <span class="badge">Live Preview Working</span>
</body>
</html>`);
    const [sandboxOutput, setSandboxOutput] = useState('');

    // Knowledge check state per lesson
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchCourse = async () => {
            try {
                const response = await api.get(`/courses/details.php?id=${id}&student_id=${user.id}`);
                const data = response.data;
                setCourse(data);
                setProgressPercentage(data.progress_percentage || 0);
                
                // Track completed lesson IDs
                const completed = (data.completed_lesson_ids || []).map(Number);
                setCompletedLessonIds(completed);

                // Auto-select first lesson from the first UNLOCKED module
                let defaultLesson = null;
                if (data.modules && data.modules.length > 0) {
                    for (const mod of data.modules) {
                        if (mod.is_locked) continue; // Skip locked modules
                        for (const les of mod.lessons) {
                            if (!defaultLesson) defaultLesson = les;
                            if (!completed.includes(Number(les.id))) {
                                defaultLesson = les;
                                break;
                            }
                        }
                        if (defaultLesson && !completed.includes(Number(defaultLesson.id))) break;
                    }
                }
                setCurrentLesson(defaultLesson || (data.modules[0]?.lessons[0] || null));
            } catch (err) {
                console.error("Failed to load course details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id, user, navigate]);

    // Handle running sandbox code
    const handleRunSandbox = () => {
        setSandboxOutput(sandboxCode);
    };

    // Flatten all playable lessons across all modules for previous/next navigation
    const allLessons = course?.modules ? course.modules.flatMap(m => m.lessons.map(l => ({ ...l, moduleId: m.id, isLocked: m.is_locked }))) : [];
    const currentIndex = currentLesson ? allLessons.findIndex(l => l.id === currentLesson.id) : -1;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    const handleMarkComplete = async () => {
        if (!currentLesson || !user) return;
        setMarkingComplete(true);
        try {
            const res = await api.post('/lessons/complete.php', {
                student_id: user.id,
                course_id: course.id,
                lesson_id: currentLesson.id
            });
            
            // Add to completed list
            const updated = Array.from(new Set([...completedLessonIds, Number(currentLesson.id)]));
            setCompletedLessonIds(updated);
            setProgressPercentage(res.data.progress_percentage);

            // Re-fetch course details to update locks on newly satisfied modules
            const refreshed = await api.get(`/courses/details.php?id=${id}&student_id=${user.id}`);
            setCourse(refreshed.data);

            // Auto-advance to next lesson if available and not locked
            if (nextLesson && !nextLesson.isLocked) {
                setCurrentLesson(nextLesson);
            }
        } catch (err) {
            console.error("Failed to mark lesson complete", err);
        } finally {
            setMarkingComplete(false);
        }
    };

    // Knowledge check helper questions
    const sampleQuestions = [
        {
            id: 1,
            question: "What is the primary role of this concept in modern software architecture?",
            options: [
                "It enables scalable, modular, and maintainable logic separation.",
                "It restricts database access exclusively to local storage.",
                "It slows down page rendering to conserve memory.",
                "It deletes unused CSS selectors automatically."
            ],
            correct: 0,
            explanation: "Separation of concerns and modular component structure ensure long-term maintainability and performance."
        },
        {
            id: 2,
            question: "Which of the following is considered a development best practice for this workflow?",
            options: [
                "Bypassing data validation on form inputs.",
                "Writing clean, reusable functions and verifying state changes.",
                "Storing plain-text passwords directly in HTML attributes.",
                "Disabling accessibility screen readers."
            ],
            correct: 1,
            explanation: "Reusability, purity of state handlers, and robust validation form the cornerstone of production quality."
        }
    ];

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading your Coursera-style learning space...</h5>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container py-5 text-center">
                <h4>Course not found.</h4>
                <Link to="/courses" className="btn btn-primary mt-3">Browse Courses</Link>
            </div>
        );
    }

    const isCurrentCompleted = currentLesson && completedLessonIds.includes(Number(currentLesson.id));

    return (
        <div className="container-fluid p-0 bg-white" style={{ minHeight: 'calc(100vh - 120px)' }}>
            <div className="row g-0">
                {/* Left Sidebar: Coursera-style Curriculum Breakdown */}
                <div className="col-lg-3 col-md-4 border-end bg-light p-3" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                    <div className="mb-3">
                        <Link to={`/courses/${course.id}`} className="text-decoration-none text-secondary small">
                            &larr; Back to Course Overview
                        </Link>
                        <h6 className="fw-bold text-dark mt-2 mb-1">{course.title}</h6>
                        <small className="text-muted d-block mb-2">Instructor: {course.instructor}</small>

                        {/* Progress Bar */}
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold text-secondary">Course Progress</span>
                            <span className="badge bg-primary">{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                            <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    <hr className="my-3" />

                    {/* Modules & Lessons Accordion with Prerequisite Locking */}
                    <div className="accordion accordion-flush" id="moduleAccordion">
                        {course.modules.map((mod, mIdx) => {
                            const isLocked = mod.is_locked;
                            return (
                                <div className={`accordion-item border-0 mb-2 rounded shadow-sm overflow-hidden ${isLocked ? 'opacity-75' : ''}`} key={mod.id}>
                                    <h2 className="accordion-header" id={`modHeading-${mod.id}`}>
                                        <button 
                                            className={`accordion-button py-2 px-3 fw-bold small ${isLocked ? 'bg-secondary-subtle text-secondary' : 'bg-white text-dark'}`}
                                            type="button" 
                                            data-bs-toggle="collapse" 
                                            data-bs-target={`#modCollapse-${mod.id}`}
                                            aria-expanded={!isLocked}
                                        >
                                            <div className="d-flex align-items-center justify-content-between w-100 me-2">
                                                <span>
                                                    {isLocked ? '🔒 ' : mod.is_completed ? '✅ ' : '📂 '}
                                                    Module {mIdx + 1}: {mod.title}
                                                </span>
                                                {isLocked && (
                                                    <span className="badge bg-warning text-dark ms-2 small">
                                                        Locked
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    </h2>
                                    <div id={`modCollapse-${mod.id}`} className={`accordion-collapse collapse ${!isLocked ? 'show' : ''}`}>
                                        <div className="accordion-body p-0">
                                            {isLocked ? (
                                                <div className="p-3 bg-light text-center small text-danger border-top">
                                                    <span className="fs-5 d-block mb-1">🔒 Module Locked</span>
                                                    <span>Complete <strong>{mod.prerequisite_title || 'previous module'}</strong> to unlock this module and its assessments.</span>
                                                </div>
                                            ) : (
                                                <div className="list-group list-group-flush">
                                                    {mod.lessons.map(les => {
                                                        const isCompleted = completedLessonIds.includes(Number(les.id));
                                                        const isActive = currentLesson?.id === les.id;
                                                        return (
                                                            <button
                                                                key={les.id}
                                                                onClick={() => setCurrentLesson(les)}
                                                                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 border-0 small ${
                                                                    isActive ? 'bg-primary text-white fw-bold' : isCompleted ? 'bg-light text-secondary' : 'text-dark'
                                                                }`}
                                                            >
                                                                <div className="d-flex align-items-center text-truncate me-2">
                                                                    <span className="me-2 fs-6">
                                                                        {isCompleted ? '✅' : '▶️'}
                                                                    </span>
                                                                    <span className="text-truncate">{les.title}</span>
                                                                </div>
                                                                <span className={`badge ${isActive ? 'bg-light text-primary' : 'bg-secondary-subtle text-secondary'} rounded-pill`}>
                                                                    {les.duration}m
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Course Quizzes & Assessments */}
                    <div className="card border-0 bg-primary-subtle p-3 mt-3 text-center rounded-3">
                        <h6 className="fw-bold text-primary mb-1">Graded Assessments</h6>
                        <small className="text-secondary mb-2">Test your understanding & unlock your certificate.</small>
                        <Link to={`/courses/${course.id}/quiz`} className="btn btn-primary btn-sm fw-bold shadow-sm">
                            📝 Take Final Course Quiz
                        </Link>
                    </div>
                </div>

                {/* Right Main Player Screen */}
                <div className="col-lg-9 col-md-8 p-4 d-flex flex-column" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                    {currentLesson ? (
                        <>
                            {/* Lesson Title Header */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <span className="badge bg-secondary-subtle text-secondary mb-1">
                                        Lesson {currentIndex + 1} of {allLessons.length}
                                    </span>
                                    <h3 className="fw-bold text-dark mb-0">{currentLesson.title}</h3>
                                    <p className="text-secondary small mb-0">{currentLesson.description}</p>
                                </div>
                                <div className="text-end">
                                    <span className="badge bg-info-subtle text-info-emphasis px-3 py-2">
                                        ⏱️ {currentLesson.duration} Minutes
                                    </span>
                                </div>
                            </div>

                            {/* Video Player Container */}
                            <div className="ratio ratio-16x9 bg-dark rounded-3 shadow-sm mb-4 overflow-hidden">
                                {currentLesson.video_url ? (
                                    <iframe 
                                        src={currentLesson.video_url} 
                                        title={currentLesson.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="d-flex align-items-center justify-content-center text-white h-100">
                                        <div className="text-center">
                                            <div className="display-4 mb-2">🎥</div>
                                            <h5>Video lecture placeholder</h5>
                                            <p className="text-light small">Watch and follow along with the interactive sections below.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Navigation & Complete Action Bar */}
                            <div className="card p-3 border-0 bg-light shadow-sm mb-4">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <button 
                                        className="btn btn-outline-secondary"
                                        disabled={!prevLesson}
                                        onClick={() => setCurrentLesson(prevLesson)}
                                    >
                                        &larr; Previous Lesson
                                    </button>

                                    <button 
                                        className={`btn ${isCurrentCompleted ? 'btn-success' : 'btn-primary'} px-4 fw-bold shadow-sm`}
                                        onClick={handleMarkComplete}
                                        disabled={markingComplete}
                                    >
                                        {markingComplete ? 'Saving...' : isCurrentCompleted ? '✓ Completed (Review Again)' : 'Mark as Completed & Continue &rarr;'}
                                    </button>

                                    <button 
                                        className="btn btn-outline-secondary"
                                        disabled={!nextLesson || nextLesson.isLocked}
                                        onClick={() => setCurrentLesson(nextLesson)}
                                        title={nextLesson?.isLocked ? "Next module is locked" : ""}
                                    >
                                        Next Lesson &rarr;
                                    </button>
                                </div>
                            </div>

                            {/* Coursera-style Tab Content (Notes, Code Sandbox, Knowledge Check, Resources, Assignments) */}
                            <div className="card border-0 shadow-sm flex-grow-1 p-4 mb-4">
                                <ul className="nav nav-pills mb-3 border-bottom pb-2">
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'notes' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('notes')}
                                        >
                                            📖 Lecture Notes
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'interactive' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => {
                                                setActiveTab('interactive');
                                                if (!sandboxOutput) handleRunSandbox();
                                            }}
                                        >
                                            💻 Live Code Sandbox
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'quiz_check' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('quiz_check')}
                                        >
                                            ⚡ Quick Knowledge Check
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'resources' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('resources')}
                                        >
                                            📦 Course Resources ({course.resources?.length || 0})
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'assignments' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('assignments')}
                                        >
                                            📝 Assignments ({course.assignments?.length || 0})
                                        </button>
                                    </li>
                                </ul>

                                <div className="tab-content">
                                    {/* Tab 1: Lecture Notes */}
                                    {activeTab === 'notes' && (
                                        <div className="p-2">
                                            {/* Accessibility Voiceover Listen Bar */}
                                            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-primary-subtle rounded-3 border border-primary-subtle">
                                                <div className="d-flex align-items-center">
                                                    <span className="fs-4 me-2">🎙️</span>
                                                    <div>
                                                        <strong className="text-primary-emphasis d-block small">Accessibility Voiceover &amp; Screen Reader</strong>
                                                        <small className="text-secondary">Listen to this entire lecture read aloud automatically.</small>
                                                    </div>
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
                                                            className="btn btn-primary btn-sm fw-bold px-3 shadow-sm"
                                                            onClick={() => speak(`${currentLesson.title}. ${currentLesson.description}. ${currentLesson.text_content}`)}
                                                        >
                                                            🔊 Listen to Lecture
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {currentLesson.text_content ? (
                                                <div 
                                                    className="lh-lg"
                                                    style={{ whiteSpace: 'pre-line', fontFamily: 'system-ui, -apple-system, sans-serif' }}
                                                >
                                                    {currentLesson.text_content}
                                                </div>
                                            ) : (
                                                <p className="text-muted">No supplementary notes provided for this lesson.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab 2: Interactive Code Sandbox */}
                                    {activeTab === 'interactive' && (
                                        <div className="p-2">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-0">💻 Interactive Code Sandbox &amp; Playground</h6>
                                                    <small className="text-muted">Edit HTML, CSS &amp; JavaScript code and render live output instantly.</small>
                                                </div>
                                                <button 
                                                    className="btn btn-success btn-sm fw-bold px-4 shadow-sm"
                                                    onClick={handleRunSandbox}
                                                >
                                                    ▶️ Run Code
                                                </button>
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-lg-6">
                                                    <label className="form-label small fw-bold text-secondary">Code Editor</label>
                                                    <textarea 
                                                        className="form-control font-monospace bg-dark text-light p-3 rounded-3"
                                                        rows="12"
                                                        value={sandboxCode}
                                                        onChange={(e) => setSandboxCode(e.target.value)}
                                                        spellCheck="false"
                                                        style={{ fontSize: '13px', tabSize: 2 }}
                                                    ></textarea>
                                                </div>
                                                <div className="col-lg-6">
                                                    <label className="form-label small fw-bold text-secondary">Live Output Preview</label>
                                                    <div className="border rounded-3 p-0 bg-white shadow-sm overflow-hidden" style={{ height: '315px' }}>
                                                        <iframe 
                                                            title="Sandbox Preview"
                                                            srcDoc={sandboxOutput || sandboxCode}
                                                            sandbox="allow-scripts"
                                                            className="w-100 h-100 border-0"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 3: Quick In-Lesson Knowledge Check */}
                                    {activeTab === 'quiz_check' && (
                                        <div className="p-2">
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-0">⚡ Quick Knowledge Check</h6>
                                                    <small className="text-muted">Check your comprehension of this section before moving on.</small>
                                                </div>
                                                {quizSubmitted && (
                                                    <span className="badge bg-success px-3 py-2">
                                                        ✓ Knowledge Check Completed
                                                    </span>
                                                )}
                                            </div>

                                            <div className="d-flex flex-column gap-3">
                                                {sampleQuestions.map((q, idx) => {
                                                    const selected = selectedAnswers[q.id];
                                                    const isAnswered = selected !== undefined;
                                                    const isCorrect = selected === q.correct;

                                                    return (
                                                        <div className="card border p-3 rounded-3" key={q.id}>
                                                            <p className="fw-bold mb-2">Q{idx + 1}. {q.question}</p>
                                                            <div className="d-flex flex-column gap-2 mb-2">
                                                                {q.options.map((opt, oIdx) => {
                                                                    let btnClass = "btn btn-outline-secondary text-start btn-sm py-2 px-3";
                                                                    if (selected === oIdx) {
                                                                        btnClass = oIdx === q.correct 
                                                                            ? "btn btn-success text-start btn-sm py-2 px-3 fw-bold"
                                                                            : "btn btn-danger text-start btn-sm py-2 px-3 fw-bold";
                                                                    } else if (quizSubmitted && oIdx === q.correct) {
                                                                        btnClass = "btn btn-outline-success text-start btn-sm py-2 px-3 fw-bold";
                                                                    }

                                                                    return (
                                                                        <button 
                                                                            key={oIdx}
                                                                            className={btnClass}
                                                                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                                                        >
                                                                            <span className="me-2">{['A', 'B', 'C', 'D'][oIdx]}.</span>
                                                                            {opt}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {isAnswered && (
                                                                <div className={`p-2 rounded small ${isCorrect ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                                                                    <strong>{isCorrect ? '✓ Correct!' : '✗ Not quite.'}</strong> {q.explanation}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="mt-3 text-end">
                                                <button 
                                                    className="btn btn-primary fw-bold px-4"
                                                    onClick={() => setQuizSubmitted(true)}
                                                    disabled={Object.keys(selectedAnswers).length < sampleQuestions.length}
                                                >
                                                    Validate Answers
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 4: Course Resources */}
                                    {activeTab === 'resources' && (
                                        <div className="p-2">
                                            <h6 className="fw-bold mb-3">Downloadable Course Resources</h6>
                                            {course.resources && course.resources.length > 0 ? (
                                                <div className="list-group">
                                                    {course.resources.map(res => (
                                                        <div className="list-group-item d-flex justify-content-between align-items-center py-3" key={res.id}>
                                                            <div>
                                                                <span className="badge bg-secondary me-2 text-uppercase">{res.resource_type}</span>
                                                                <strong className="text-dark">{res.title}</strong>
                                                                <p className="text-secondary small mb-0 mt-1">{res.description}</p>
                                                            </div>
                                                            <a 
                                                                href={res.resource_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="btn btn-outline-primary btn-sm px-3"
                                                            >
                                                                📥 Download / Open
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted">No supplementary files have been uploaded yet for this course.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab 5: Course Assignments */}
                                    {activeTab === 'assignments' && (
                                        <div className="p-2">
                                            <h6 className="fw-bold mb-3">Course Assignments &amp; Projects</h6>
                                            {course.assignments && course.assignments.length > 0 ? (
                                                <div className="list-group">
                                                    {course.assignments.map(assn => (
                                                        <div className="list-group-item d-flex justify-content-between align-items-center py-3" key={assn.id}>
                                                            <div>
                                                                <h6 className="fw-bold text-dark mb-1">{assn.title}</h6>
                                                                <p className="text-secondary small mb-1">{assn.description}</p>
                                                                <div className="d-flex gap-2 small">
                                                                    <span className="badge bg-light text-dark border">
                                                                        📅 Due: {assn.due_date || 'No deadline'}
                                                                    </span>
                                                                    <span className="badge bg-light text-dark border">
                                                                        💯 Max Marks: {assn.max_marks}
                                                                    </span>
                                                                    {assn.submission && (
                                                                        <span className={`badge ${assn.submission.status === 'graded' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                                            {assn.submission.status === 'graded' ? `Graded: ${assn.submission.grade}/${assn.max_marks}` : 'Submitted - Under Review'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <Link 
                                                                to={`/assignments/${assn.id}`} 
                                                                className="btn btn-primary btn-sm fw-bold px-3"
                                                            >
                                                                {assn.submission ? 'View Feedback' : 'Submit Task &rarr;'}
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted">No assignments posted for this course.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center my-auto py-5">
                            <h4>Select a lesson from the sidebar to begin learning.</h4>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoursePlayer;
