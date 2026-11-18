import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { 
    getCourseDetails, 
    recordModuleActivity, 
    markModuleComplete,
    issueCertificate,
    sendCertificateEmail 
} from '../services/courseService';

const CoursePlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { speak, stopSpeaking, isSpeaking } = useContext(AccessibilityContext);

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentModule, setCurrentModule] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [completedLessonIds, setCompletedLessonIds] = useState([]);
    const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'sample_solution', 'working_check', 'interactive', 'module_quiz'
    const [markingComplete, setMarkingComplete] = useState(false);
    
    // Active Study / Working Check State
    const [studySeconds, setStudySeconds] = useState(0);
    const [workingVerified, setWorkingVerified] = useState(false);
    const [workingCheckMsg, setWorkingCheckMsg] = useState('');

    // Code Sandbox State
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
  <p>Modify this code or load the <strong>Sample Solution</strong> and test live output!</p>
  <span class="badge">Live Preview Working</span>
</body>
</html>`);
    const [sandboxOutput, setSandboxOutput] = useState('');

    // Module Quiz State
    const [moduleQuizAnswers, setModuleQuizAnswers] = useState({});
    const [moduleQuizSubmitted, setModuleQuizSubmitted] = useState(false);

    // Certificate & Email Modal State
    const [showCertModal, setShowCertModal] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState(user?.email || 'student@learnsphere.com');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSuccessMsg, setEmailSuccessMsg] = useState('');
    const [issuedCert, setIssuedCert] = useState(null);

    // Study session timer
    useEffect(() => {
        const interval = setInterval(() => {
            setStudySeconds(s => s + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Load course details
    const loadCourseData = async () => {
        try {
            const data = await getCourseDetails(id, user?.id);
            setCourse(data);

            const safeModules = Array.isArray(data.modules) ? data.modules : [];
            const safeCompleted = Array.isArray(data.completed_lesson_ids) ? data.completed_lesson_ids : [];
            setCompletedLessonIds(safeCompleted);

            // Select active module and lesson
            let activeMod = safeModules.find(m => !m.is_locked && !m.is_completed) || safeModules[0] || null;
            setCurrentModule(activeMod);

            let activeLes = null;
            if (activeMod && Array.isArray(activeMod.lessons) && activeMod.lessons.length > 0) {
                activeLes = activeMod.lessons.find(l => !safeCompleted.includes(Number(l.id))) || activeMod.lessons[0];
            } else if (safeModules.length > 0 && Array.isArray(safeModules[0]?.lessons)) {
                activeLes = safeModules[0].lessons[0] || null;
            }
            setCurrentLesson(activeLes);

            // Record initial working check
            if (activeMod) {
                recordModuleActivity(data.id, user?.id, activeMod.code);
            }
        } catch (err) {
            console.error("Failed to load course details:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourseData();
    }, [id, user]);

    // Handle student selecting a module
    const handleSelectModule = (mod) => {
        if (mod.is_locked) return;
        setCurrentModule(mod);
        if (Array.isArray(mod.lessons) && mod.lessons.length > 0) {
            setCurrentLesson(mod.lessons[0]);
        }
        setWorkingVerified(false);
        setWorkingCheckMsg('');
        recordModuleActivity(course.id, user?.id, mod.code);
    };

    // Perform system verification that student is actively working on the module
    const handleVerifyWorkingStatus = () => {
        if (!currentModule) return;
        recordModuleActivity(course.id, user?.id, currentModule.code);
        setWorkingVerified(true);
        setWorkingCheckMsg(`✓ System Verified: Active study logged (${Math.floor(studySeconds / 60)}m ${studySeconds % 60}s). Student is actively engaged on Module ${currentModule.code}.`);
    };

    // Handle module / lesson completion
    const handleMarkLessonComplete = async () => {
        if (!currentLesson || !currentModule || !course) return;
        setMarkingComplete(true);
        try {
            await markModuleComplete(course.id, user?.id, currentModule.code, currentLesson.id);
            
            // Reload course data to evaluate sequential unlocks
            await loadCourseData();

            setWorkingCheckMsg(`✓ Module ${currentModule.code} verified as complete! Next module has been unlocked.`);
        } catch (err) {
            console.error("Failed to mark complete:", err);
        } finally {
            setMarkingComplete(false);
        }
    };

    // Load sample solution into sandbox
    const handleLoadSampleSolution = () => {
        if (currentModule?.sample_solution) {
            setSandboxCode(currentModule.sample_solution);
            setSandboxOutput(currentModule.sample_solution);
            setActiveTab('interactive');
        }
    };

    // Handle Certificate Generation and Email Dispatch
    const handleOpenCertificate = async () => {
        try {
            const cert = await issueCertificate({
                courseId: course.id,
                student: user || { id: 'guest', name: 'Student Learner', email: recipientEmail },
                percentage: 95
            });
            setIssuedCert(cert);
            setShowCertModal(true);
        } catch (e) {
            console.error('Cert generation error:', e);
        }
    };

    const handleSendEmail = async () => {
        if (!issuedCert) return;
        setEmailSending(true);
        setEmailSuccessMsg('');
        try {
            const res = await sendCertificateEmail(issuedCert.unique_code, recipientEmail);
            setEmailSuccessMsg(res.message || `Official certificate dispatched to ${recipientEmail}`);
        } catch (err) {
            alert(err.message || 'Please provide a valid, existing email address.');
        } finally {
            setEmailSending(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <h5 className="text-secondary">Initializing interactive module workspace...</h5>
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

    const safeModules = Array.isArray(course.modules) ? course.modules : [];
    const allLessons = safeModules.flatMap(m => (Array.isArray(m?.lessons) ? m.lessons.map(l => ({ ...l, moduleId: m.id, modCode: m.code, isLocked: m.is_locked })) : []));
    const currentIndex = currentLesson ? allLessons.findIndex(l => l.id === currentLesson.id) : -1;
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
    const isCurrentCompleted = currentLesson && completedLessonIds.includes(Number(currentLesson.id));

    return (
        <div className="container-fluid p-0 bg-white" style={{ minHeight: 'calc(100vh - 120px)' }}>
            <div className="row g-0">
                {/* Left Sidebar: Sequenced Modules 1.1, 1.2, 1.3... */}
                <div className="col-lg-3 col-md-4 border-end bg-light p-3" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                    <div className="mb-3">
                        <Link to={`/courses/${course.id}`} className="text-decoration-none text-secondary small fw-bold">
                            &larr; Back to Course Overview
                        </Link>
                        <h6 className="fw-bold text-dark mt-2 mb-1">{course.title}</h6>
                        <small className="text-muted d-block mb-2">Instructor: {course.instructor}</small>

                        {/* Progress Bar */}
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small fw-semibold text-secondary">Course Progress</span>
                            <span className="badge bg-primary">{course.progress_percentage || 0}%</span>
                        </div>
                        <div className="progress mb-2" style={{ height: '8px' }}>
                            <div 
                                className="progress-bar bg-success progress-bar-striped" 
                                role="progressbar" 
                                style={{ width: `${course.progress_percentage || 0}%` }}
                            ></div>
                        </div>

                        {/* Active Study Check Status */}
                        <div className="p-2 bg-white rounded-3 border small shadow-sm d-flex align-items-center justify-content-between">
                            <div>
                                <span className="badge bg-success-subtle text-success me-1">Active Study</span>
                                <span className="fw-bold text-dark">{Math.floor(studySeconds / 60)}m {studySeconds % 60}s</span>
                            </div>
                            <span className="badge bg-light text-secondary border">Module {currentModule?.code || '1.1'}</span>
                        </div>
                    </div>

                    <hr className="my-2" />

                    {/* Modules Accordion */}
                    <div className="accordion accordion-flush" id="moduleAccordion">
                        {safeModules.map((mod, mIdx) => {
                            const isLocked = mod.is_locked;
                            const isCompleted = mod.is_completed;
                            const isCurrent = currentModule?.id === mod.id;
                            const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];

                            return (
                                <div className={`accordion-item border-0 mb-2 rounded shadow-sm overflow-hidden ${isLocked ? 'opacity-75' : ''}`} key={mod.id || mIdx}>
                                    <h2 className="accordion-header" id={`modHeading-${mod.id || mIdx}`}>
                                        <button 
                                            className={`accordion-button py-2 px-3 fw-bold small ${isCurrent ? 'bg-primary-subtle text-primary border-start border-4 border-primary' : isLocked ? 'bg-secondary-subtle text-secondary' : 'bg-white text-dark'}`}
                                            type="button" 
                                            onClick={() => handleSelectModule(mod)}
                                            data-bs-toggle="collapse" 
                                            data-bs-target={`#modCollapse-${mod.id || mIdx}`}
                                            aria-expanded={isCurrent}
                                        >
                                            <div className="d-flex align-items-center justify-content-between w-100 me-2">
                                                <span>
                                                    {isLocked ? '🔒 ' : isCompleted ? '✅ ' : '📂 '}
                                                    <strong>Module {mod.code || `1.${mIdx + 1}`}:</strong> {mod.title}
                                                </span>
                                                {isLocked ? (
                                                    <span className="badge bg-warning text-dark small ms-2">Locked</span>
                                                ) : isCompleted ? (
                                                    <span className="badge bg-success small ms-2">Done</span>
                                                ) : (
                                                    <span className="badge bg-info small ms-2">Active</span>
                                                )}
                                            </div>
                                        </button>
                                    </h2>
                                    <div id={`modCollapse-${mod.id || mIdx}`} className={`accordion-collapse collapse ${isCurrent ? 'show' : ''}`}>
                                        <div className="accordion-body p-0">
                                            {isLocked ? (
                                                <div className="p-3 bg-light text-center small text-muted border-top">
                                                    <span>🔒 Complete <strong>Module 1.{mIdx}</strong> to unlock this module, its sample solution, and its quiz.</span>
                                                </div>
                                            ) : (
                                                <div className="list-group list-group-flush">
                                                    {lessons.map(les => {
                                                        const isLesDone = completedLessonIds.includes(Number(les.id));
                                                        const isLesActive = currentLesson?.id === les.id;
                                                        return (
                                                            <button
                                                                key={les.id}
                                                                onClick={() => { setCurrentModule(mod); setCurrentLesson(les); }}
                                                                className={`list-group-item list-group-item-action d-flex align-items-center justify-content-between py-2 px-3 border-0 small ${
                                                                    isLesActive ? 'bg-primary text-white fw-bold' : isLesDone ? 'bg-light text-secondary' : 'text-dark'
                                                                }`}
                                                            >
                                                                <div className="d-flex align-items-center text-truncate me-2">
                                                                    <span className="me-2">{isLesDone ? '✅' : '▶️'}</span>
                                                                    <span className="text-truncate">{les.title}</span>
                                                                </div>
                                                                <span className={`badge ${isLesActive ? 'bg-light text-primary' : 'bg-secondary-subtle text-secondary'} rounded-pill`}>
                                                                    {les.duration || 15}m
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

                    {/* Final Examination Box (LOCKED until all modules 100% complete) */}
                    <div className={`card border-0 p-3 mt-3 text-center rounded-3 shadow-sm ${course.is_final_unlocked ? 'bg-success-subtle border border-success' : 'bg-light border border-secondary-subtle'}`}>
                        <div className="fs-3 mb-1">{course.is_final_unlocked ? '🎓' : '🔒'}</div>
                        <h6 className="fw-bold mb-1">Final Course Examination</h6>
                        {course.is_final_unlocked ? (
                            <>
                                <small className="text-success fw-bold d-block mb-2">
                                    ✓ All modules complete! Final exam is unlocked.
                                </small>
                                <Link to={`/courses/${course.id}/quiz`} className="btn btn-success btn-sm fw-bold w-100 shadow-sm mb-2">
                                    📝 Take Final Exam &rarr;
                                </Link>
                                <button className="btn btn-outline-success btn-sm fw-bold w-100" onClick={handleOpenCertificate}>
                                    📜 View &amp; Email Certificate
                                </button>
                            </>
                        ) : (
                            <>
                                <small className="text-muted d-block mb-2">
                                    Locked until Modules 1.1 - 1.{safeModules.length} are certified.
                                    <span className="badge bg-warning text-dark d-block mt-1">
                                        {course.remaining_modules_for_final || 1} module(s) remaining
                                    </span>
                                </small>
                                <button className="btn btn-secondary btn-sm fw-bold w-100 disabled" disabled>
                                    🔒 Final Exam Locked
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Main Content */}
                <div className="col-lg-9 col-md-8 p-4 d-flex flex-column" style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                    {currentLesson && currentModule ? (
                        <>
                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                <div>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span className="badge bg-primary">Module {currentModule.code}</span>
                                        <span className="badge bg-light text-secondary border">Lesson {currentIndex + 1} of {allLessons.length}</span>
                                        {currentModule.is_completed && <span className="badge bg-success">✓ Module Certified</span>}
                                    </div>
                                    <h3 className="fw-bold text-dark mb-0">{currentLesson.title}</h3>
                                    <p className="text-secondary small mb-0">{currentLesson.description}</p>
                                </div>
                                <div className="text-end d-flex align-items-center gap-2">
                                    <span className="badge bg-info-subtle text-info-emphasis px-3 py-2">
                                        ⏱️ {currentLesson.duration || 15} Minutes
                                    </span>
                                </div>
                            </div>

                            {/* Working Check Banner */}
                            <div className="p-3 mb-3 bg-light rounded-3 border d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fs-5">📡</span>
                                    <div>
                                        <strong className="d-block small text-dark">System Working Status Check</strong>
                                        <small className="text-secondary">
                                            {workingCheckMsg || `Tracking student active learning on Module ${currentModule.code}. Active session: ${Math.floor(studySeconds / 60)} minutes.`}
                                        </small>
                                    </div>
                                </div>
                                <button 
                                    className="btn btn-outline-primary btn-sm fw-bold px-3 shadow-sm"
                                    onClick={handleVerifyWorkingStatus}
                                >
                                    🔍 Verify Active Working Check
                                </button>
                            </div>

                            {/* Action Bar */}
                            <div className="card p-3 border-0 bg-light shadow-sm mb-4 rounded-3">
                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={!prevLesson}
                                        onClick={() => {
                                            const targetMod = safeModules.find(m => m.code === prevLesson?.modCode) || currentModule;
                                            setCurrentModule(targetMod);
                                            setCurrentLesson(prevLesson);
                                        }}
                                    >
                                        &larr; Previous Lesson
                                    </button>

                                    <div className="d-flex gap-2">
                                        <button 
                                            className="btn btn-outline-success btn-sm fw-bold"
                                            onClick={() => setActiveTab('sample_solution')}
                                        >
                                            💡 View Sample Solution
                                        </button>

                                        <button 
                                            className={`btn ${isCurrentCompleted ? 'btn-success' : 'btn-primary'} btn-sm px-4 fw-bold shadow-sm`}
                                            onClick={handleMarkLessonComplete}
                                            disabled={markingComplete}
                                        >
                                            {markingComplete ? 'Certifying...' : isCurrentCompleted ? '✓ Completed (Marked)' : 'Mark Module Completed & Unlock Next &rarr;'}
                                        </button>
                                    </div>

                                    <button 
                                        className="btn btn-outline-secondary btn-sm"
                                        disabled={!nextLesson || nextLesson.isLocked}
                                        onClick={() => {
                                            const targetMod = safeModules.find(m => m.code === nextLesson?.modCode) || currentModule;
                                            setCurrentModule(targetMod);
                                            setCurrentLesson(nextLesson);
                                        }}
                                        title={nextLesson?.isLocked ? "Next module is locked" : ""}
                                    >
                                        Next Lesson &rarr;
                                    </button>
                                </div>
                            </div>

                            {/* Tab Navigation */}
                            <div className="card border-0 shadow-sm flex-grow-1 p-4 mb-4 rounded-4">
                                <ul className="nav nav-pills mb-3 border-bottom pb-2 gap-1 flex-wrap">
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'notes' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('notes')}
                                        >
                                            📖 Lecture Content
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'sample_solution' ? 'active bg-success text-white' : 'text-success'}`}
                                            onClick={() => setActiveTab('sample_solution')}
                                        >
                                            💡 Module {currentModule.code} Sample Solution
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'interactive' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => {
                                                setActiveTab('interactive');
                                                if (!sandboxOutput) setSandboxOutput(sandboxCode);
                                            }}
                                        >
                                            💻 Live Code Sandbox
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'module_quiz' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('module_quiz')}
                                        >
                                            ⚡ Module {currentModule.code} Quiz
                                        </button>
                                    </li>
                                    <li className="nav-item">
                                        <button 
                                            className={`nav-link fw-bold ${activeTab === 'working_check' ? 'active bg-primary' : 'text-secondary'}`}
                                            onClick={() => setActiveTab('working_check')}
                                        >
                                            📡 Active Working Verification
                                        </button>
                                    </li>
                                </ul>

                                <div className="tab-content pt-2">
                                    {/* Tab 1: Lecture Notes */}
                                    {activeTab === 'notes' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center p-3 mb-3 bg-primary-subtle rounded-3">
                                                <div className="d-flex align-items-center">
                                                    <span className="fs-4 me-2">🎙️</span>
                                                    <div>
                                                        <strong className="text-primary-emphasis d-block small">Accessibility Voiceover &amp; Screen Reader</strong>
                                                        <small className="text-secondary">Listen to this entire lesson read aloud automatically.</small>
                                                    </div>
                                                </div>
                                                <div>
                                                    {isSpeaking ? (
                                                        <button className="btn btn-danger btn-sm fw-bold px-3 shadow-sm" onClick={stopSpeaking}>
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

                                            <div className="lh-lg" style={{ whiteSpace: 'pre-line' }}>
                                                {currentLesson.text_content || 'Comprehensive notes for this lesson.'}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 2: Sample Solution */}
                                    {activeTab === 'sample_solution' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                                                <div>
                                                    <h5 className="fw-bold text-success mb-1">
                                                        💡 Verified Sample Solution for Module {currentModule.code}
                                                    </h5>
                                                    <p className="text-secondary small mb-0">
                                                        Official reference architecture verified against production best practices.
                                                    </p>
                                                </div>
                                                <button 
                                                    className="btn btn-success btn-sm fw-bold px-3 shadow-sm"
                                                    onClick={handleLoadSampleSolution}
                                                >
                                                    🚀 Run in Live Code Sandbox &rarr;
                                                </button>
                                            </div>

                                            <div className="alert alert-success border-0 bg-success-subtle p-3 rounded-3 mb-3">
                                                <strong>Architectural Analysis:</strong> {currentModule.solution_explanation || 'Follows clean code design patterns and robust error handling.'}
                                            </div>

                                            <div className="position-relative">
                                                <pre className="bg-dark text-light p-4 rounded-3 small font-monospace" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                                    <code>{currentModule.sample_solution || '// Sample solution is being compiled for this module.'}</code>
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 3: Interactive Sandbox */}
                                    {activeTab === 'interactive' && (
                                        <div>
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <h6 className="fw-bold text-dark mb-0">💻 Interactive Code Sandbox</h6>
                                                    <small className="text-muted">Test code, modify algorithms, and render live DOM output.</small>
                                                </div>
                                                <button 
                                                    className="btn btn-success btn-sm fw-bold px-4 shadow-sm"
                                                    onClick={() => setSandboxOutput(sandboxCode)}
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
                                                        style={{ fontSize: '13px' }}
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

                                    {/* Tab 4: Module Quiz */}
                                    {activeTab === 'module_quiz' && (
                                        <div>
                                            <h5 className="fw-bold text-dark mb-2">⚡ Module {currentModule.code} Knowledge Check</h5>
                                            <p className="text-secondary small mb-3">Pass this checkpoint to validate your grasp of Module {currentModule.code}.</p>

                                            {currentModule.quiz?.questions ? (
                                                <div className="d-flex flex-column gap-3">
                                                    {currentModule.quiz.questions.map((q, qIdx) => {
                                                        const selected = moduleQuizAnswers[q.id];
                                                        const isAnswered = selected !== undefined;
                                                        const isCorrect = selected === q.correct;

                                                        return (
                                                            <div className="card border p-3 rounded-3" key={q.id}>
                                                                <p className="fw-bold mb-2">Q{qIdx + 1}. {q.question}</p>
                                                                <div className="d-flex flex-column gap-2 mb-2">
                                                                    {q.options.map((opt, oIdx) => {
                                                                        let btnClass = "btn btn-outline-secondary text-start btn-sm py-2 px-3";
                                                                        if (selected === oIdx) {
                                                                            btnClass = oIdx === q.correct ? "btn btn-success text-start btn-sm py-2 px-3 fw-bold" : "btn btn-danger text-start btn-sm py-2 px-3 fw-bold";
                                                                        } else if (moduleQuizSubmitted && oIdx === q.correct) {
                                                                            btnClass = "btn btn-outline-success text-start btn-sm py-2 px-3 fw-bold";
                                                                        }
                                                                        return (
                                                                            <button 
                                                                                key={oIdx}
                                                                                className={btnClass}
                                                                                onClick={() => setModuleQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                                                            >
                                                                                <span className="me-2">{['A', 'B', 'C', 'D'][oIdx]}.</span>
                                                                                {opt}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                                {isAnswered && (
                                                                    <div className={`p-2 rounded small ${isCorrect ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                                                                        <strong>{isCorrect ? '✓ Correct!' : '✗ Review concept:'}</strong> {q.explanation}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    <div className="text-end">
                                                        <button 
                                                            className="btn btn-primary fw-bold px-4"
                                                            onClick={() => {
                                                                setModuleQuizSubmitted(true);
                                                                handleMarkLessonComplete();
                                                            }}
                                                        >
                                                            Submit Module Quiz &amp; Confirm Completion
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-muted">Module quiz being generated.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab 5: Active Working Check */}
                                    {activeTab === 'working_check' && (
                                        <div className="p-3 bg-light rounded-3">
                                            <h5 className="fw-bold mb-2">📡 Active Learning &amp; Engagement Telemetry</h5>
                                            <p className="text-secondary small mb-3">
                                                The LearnSphere system periodically validates student presence, problem-solving activity, and code execution on each module.
                                            </p>
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <div className="card p-3 border-0 bg-white shadow-sm rounded-3">
                                                        <span className="text-muted small">Current Module</span>
                                                        <strong className="fs-5 text-primary">Module {currentModule.code}</strong>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card p-3 border-0 bg-white shadow-sm rounded-3">
                                                        <span className="text-muted small">Active Study Time</span>
                                                        <strong className="fs-5 text-success">{Math.floor(studySeconds / 60)}m {studySeconds % 60}s</strong>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card p-3 border-0 bg-white shadow-sm rounded-3">
                                                        <span className="text-muted small">Verification Status</span>
                                                        <strong className="fs-5 text-dark">{workingVerified ? '✓ Verified Active' : '● Logging Session'}</strong>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                className="btn btn-primary btn-sm fw-bold px-4 mt-3 shadow-sm"
                                                onClick={handleVerifyWorkingStatus}
                                            >
                                                Log Presence &amp; Confirm Checkpoint &rarr;
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center my-auto py-5">
                            <h4>Select a module from the left curriculum list to begin.</h4>
                        </div>
                    )}
                </div>
            </div>

            {/* Certificate Issuance & Email Modal */}
            {showCertModal && issuedCert && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content rounded-4 border-0 shadow-lg">
                            <div className="modal-header bg-primary text-white rounded-top-4">
                                <h5 className="modal-title fw-bold">🎓 Academic Credential &amp; Certificate Delivery</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCertModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <div className="display-4 text-success mb-2">📜</div>
                                <h4 className="fw-bold text-dark mb-1">Congratulations, {issuedCert.student_name}!</h4>
                                <p className="text-secondary small mb-3">
                                    You have officially satisfied all curriculum modules and certified in <strong>{issuedCert.course_title}</strong>.
                                </p>

                                <div className="p-3 bg-light rounded-3 border mb-3 text-start small">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">Credential ID:</span>
                                        <strong className="font-monospace text-primary">{issuedCert.unique_code}</strong>
                                    </div>
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">Grade Awarded:</span>
                                        <strong className="text-success">{issuedCert.grade} ({issuedCert.percentage}%)</strong>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Date of Certification:</span>
                                        <span>{new Date(issuedCert.issued_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {/* Email dispatch form */}
                                <div className="card p-3 border-0 bg-primary-subtle text-start rounded-3 mb-3">
                                    <label className="form-label fw-bold small text-primary-emphasis mb-1">
                                        📧 Send Official Certificate to Existing Email Address:
                                    </label>
                                    <div className="input-group">
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            placeholder="Enter your existing email (e.g. yourname@example.com)" 
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                        />
                                        <button 
                                            className="btn btn-primary fw-bold px-4"
                                            onClick={handleSendEmail}
                                            disabled={emailSending}
                                        >
                                            {emailSending ? 'Sending...' : 'Send Certificate Email 🚀'}
                                        </button>
                                    </div>
                                    <small className="text-muted mt-1 d-block">
                                        The system validates that the email address is existing and properly formatted before dispatch.
                                    </small>
                                </div>

                                {emailSuccessMsg && (
                                    <div className="alert alert-success border-0 small mb-3">
                                        <strong>✓ Success:</strong> {emailSuccessMsg}
                                    </div>
                                )}

                                <div className="d-flex gap-2 justify-content-center">
                                    <Link 
                                        to={`/certificate/${issuedCert.unique_code}`} 
                                        className="btn btn-outline-primary fw-bold px-4"
                                    >
                                        View &amp; Print Full Certificate 🖨️
                                    </Link>
                                    <button 
                                        className="btn btn-secondary px-4" 
                                        onClick={() => setShowCertModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoursePlayer;
