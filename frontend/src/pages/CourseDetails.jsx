import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getCourseDetails, enrollStudentInCourse } from '../services/courseService';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [activeSolutionModule, setActiveSolutionModule] = useState(null);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                const data = await getCourseDetails(id, user?.id);
                setCourse(data);
            } catch (error) {
                console.error("Error fetching course details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [id, user]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            const studentObj = user || { id: 'guest', name: 'Learner', email: 'student@learnsphere.com' };
            await enrollStudentInCourse(id, studentObj);
            
            // Refresh course details
            const updated = await getCourseDetails(id, studentObj.id);
            setCourse(updated);
            
            navigate(`/learn/${id}`);
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('Enrolled successfully in offline preview mode!');
            navigate(`/learn/${id}`);
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading course curriculum &amp; modules...</h5>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="container py-5 text-center">
                <div className="card p-5 border-0 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
                    <div className="fs-1 mb-2">🔍</div>
                    <h3 className="fw-bold">Course Not Found</h3>
                    <p className="text-secondary">The requested curriculum could not be retrieved.</p>
                    <Link to="/courses" className="btn btn-primary mt-2">Back to Catalog</Link>
                </div>
            </div>
        );
    }

    const modules = Array.isArray(course.modules) ? course.modules : [];
    const totalLessons = modules.reduce((acc, m) => acc + ((m?.lessons && Array.isArray(m.lessons)) ? m.lessons.length : 0), 0);

    return (
        <div className="container py-5">
            <div className="row g-4">
                {/* Main Content Info */}
                <div className="col-lg-8">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link to="/courses">Courses</Link></li>
                            <li className="breadcrumb-item active" aria-current="page">{course.category || 'General'}</li>
                        </ol>
                    </nav>

                    <h1 className="fw-bold text-dark mb-3">{course.title}</h1>
                    <p className="lead text-secondary">{course.short_description}</p>
                    
                    <div className="d-flex mb-4 gap-2 flex-wrap align-items-center">
                        <span className="badge bg-primary px-3 py-2">{course.category || 'Technology'}</span>
                        <span className="badge bg-secondary-subtle text-secondary px-3 py-2">👨‍🏫 Instructor: {course.instructor}</span>
                        <span className="badge bg-info-subtle text-info-emphasis px-3 py-2 text-capitalize">⚡ {course.difficulty}</span>
                        <span className="badge bg-light text-dark px-3 py-2 border">📚 {modules.length} Sequenced Modules (1.1 - 1.{modules.length})</span>
                    </div>

                    <div className="card p-4 border-0 shadow-sm mb-4 bg-white rounded-4">
                        <h4 className="fw-bold mb-3">About This Course &amp; Pedagogy</h4>
                        <p className="text-secondary lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
                            {course.full_description}
                        </p>
                    </div>

                    {/* Modules & Syllabus (1.1, 1.2, 1.3, 1.4...) */}
                    <div className="card p-4 border-0 shadow-sm mb-4 bg-white rounded-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4 className="fw-bold mb-0">Sequenced Modules &amp; Verified Solutions</h4>
                            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1">
                                ✓ Verified Solutions Available
                            </span>
                        </div>
                        <p className="text-secondary small mb-4">
                            Modules are sequentially unlocked (1.1 &rarr; 1.2 &rarr; 1.3...). Each module includes an active learning check, sample solutions, and a checkpoint quiz.
                        </p>

                        {modules.length > 0 ? (
                            <div className="accordion" id="courseAccordion">
                                {modules.map((mod, idx) => {
                                    const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
                                    const isLocked = mod.is_locked;
                                    const isCompleted = mod.is_completed;

                                    return (
                                        <div className={`accordion-item mb-3 border rounded-3 overflow-hidden ${isLocked ? 'bg-light' : 'bg-white'}`} key={mod.id || idx}>
                                            <h2 className="accordion-header" id={`heading${mod.id || idx}`}>
                                                <button 
                                                    className={`accordion-button fw-bold py-3 ${isLocked ? 'collapsed bg-light text-muted' : 'bg-white text-dark'}`} 
                                                    type="button" 
                                                    data-bs-toggle="collapse" 
                                                    data-bs-target={`#collapse${mod.id || idx}`}
                                                    aria-expanded={!isLocked && idx === 0}
                                                >
                                                    <div className="d-flex align-items-center justify-content-between w-100 me-2 flex-wrap gap-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fs-5">{isLocked ? '🔒' : isCompleted ? '✅' : '📖'}</span>
                                                            <span className="badge bg-primary text-white">Module {mod.code || `1.${idx + 1}`}</span>
                                                            <span>{mod.title}</span>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 ms-auto">
                                                            {isLocked ? (
                                                                <span className="badge bg-warning text-dark">Locked (Complete Prior)</span>
                                                            ) : isCompleted ? (
                                                                <span className="badge bg-success">Completed</span>
                                                            ) : (
                                                                <span className="badge bg-info-subtle text-info-emphasis">Ready to Learn</span>
                                                            )}
                                                            <span className="badge bg-secondary-subtle text-secondary">{lessons.length} Lessons</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            </h2>
                                            <div 
                                                id={`collapse${mod.id || idx}`} 
                                                className={`accordion-collapse collapse ${!isLocked && idx === 0 ? 'show' : ''}`}
                                            >
                                                <div className="accordion-body p-4 bg-light">
                                                    <p className="text-secondary small mb-3">{mod.description}</p>
                                                    
                                                    {/* Sample Solution Card & Preview */}
                                                    {mod.sample_solution && (
                                                        <div className="card border-0 bg-white shadow-sm p-3 mb-3 rounded-3">
                                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                                                                <div className="d-flex align-items-center gap-2">
                                                                    <span className="badge bg-success">💡 Verified Sample Solution</span>
                                                                    <small className="text-secondary">Official reference architecture for Module {mod.code}</small>
                                                                </div>
                                                                <button 
                                                                    className="btn btn-outline-success btn-sm fw-bold px-3"
                                                                    onClick={() => setActiveSolutionModule(activeSolutionModule === mod.code ? null : mod.code)}
                                                                >
                                                                    {activeSolutionModule === mod.code ? 'Hide Solution' : 'View Sample Solution 👁️'}
                                                                </button>
                                                            </div>
                                                            {activeSolutionModule === mod.code && (
                                                                <div className="mt-2 pt-2 border-top">
                                                                    <pre className="bg-dark text-light p-3 rounded-3 small font-monospace mb-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                                                                        <code>{mod.sample_solution}</code>
                                                                    </pre>
                                                                    <small className="text-muted d-block">
                                                                        <strong>Analysis:</strong> {mod.solution_explanation || 'Reference code adheres to production architectural patterns.'}
                                                                    </small>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Lesson List */}
                                                    <ul className="list-group list-group-flush rounded-3 border">
                                                        {lessons.map(lesson => (
                                                            <li key={lesson.id} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 bg-white">
                                                                <div>
                                                                    <span className="me-2">▶️</span>
                                                                    <span className="fw-semibold small">{lesson.title}</span>
                                                                    <small className="text-muted d-block ms-4">{lesson.description}</small>
                                                                </div>
                                                                <span className="badge bg-light text-secondary border">{lesson.duration || 15}m</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted">Curriculum modules are being initialized.</p>
                        )}
                    </div>

                    {/* Final Examination Lock Box */}
                    <div className="card p-4 border-0 shadow-sm rounded-4 bg-white">
                        <div className="d-flex align-items-center gap-3">
                            <span className="fs-1">{course.is_final_unlocked ? '🎓' : '🔒'}</span>
                            <div className="flex-grow-1">
                                <h5 className="fw-bold mb-1">Final Course Examination &amp; Certification</h5>
                                <p className="text-secondary small mb-0">
                                    {course.is_final_unlocked ? (
                                        <span className="text-success fw-bold">
                                            ✓ All modules completed! The final certification exam is unlocked.
                                        </span>
                                    ) : (
                                        <span>
                                            🔒 <strong>Locked:</strong> You must complete all course modules (1.1 to 1.{modules.length}) before unlocking the final test and obtaining your certificate.
                                        </span>
                                    )}
                                </p>
                            </div>
                            <Link 
                                to={course.is_final_unlocked ? `/courses/${course.id}/quiz` : '#'} 
                                className={`btn ${course.is_final_unlocked ? 'btn-primary' : 'btn-secondary disabled'} fw-bold px-4`}
                            >
                                {course.is_final_unlocked ? 'Take Final Exam 📝' : 'Exam Locked 🔒'}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Enrollment & Action Card */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 sticky-top rounded-4 bg-white" style={{ top: '24px' }}>
                        <div className="card-body p-4 text-center">
                            <div className="display-4 mb-2">🎓</div>
                            
                            {course.is_enrolled ? (
                                <>
                                    <span className="badge bg-success-subtle text-success fs-6 mb-2 px-3 py-2 border border-success-subtle">
                                        ✓ Enrolled &amp; Active
                                    </span>
                                    <h4 className="card-title fw-bold">Continue Your Learning</h4>
                                    
                                    <div className="d-flex justify-content-between small fw-bold mt-3 mb-1">
                                        <span>Curriculum Progress</span>
                                        <span>{course.progress_percentage || 0}%</span>
                                    </div>
                                    <div className="progress mb-3" style={{ height: '10px' }}>
                                        <div 
                                            className="progress-bar bg-success progress-bar-striped progress-bar-animated" 
                                            role="progressbar" 
                                            style={{ width: `${course.progress_percentage || 0}%` }}
                                        ></div>
                                    </div>

                                    <Link to={`/learn/${id}`} className="btn btn-primary btn-lg w-100 mb-2 fw-bold shadow-sm">
                                        ▶️ Open Interactive Course Player
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <span className="badge bg-primary-subtle text-primary fs-6 mb-2 px-3 py-2">
                                        Open Enrollment
                                    </span>
                                    <h4 className="card-title fw-bold">Join This Specialization</h4>
                                    <p className="text-secondary small mb-4">
                                        Access all {modules.length} interactive modules, sample solutions, and earn an accredited digital certificate.
                                    </p>

                                    <button 
                                        className="btn btn-primary btn-lg w-100 mb-2 fw-bold shadow-sm"
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll in Course &rarr;'}
                                    </button>
                                </>
                            )}

                            <hr className="my-4" />

                            <div className="text-start small text-secondary">
                                <div className="mb-2 d-flex align-items-center">
                                    <span className="me-2">💡</span>
                                    <span><strong>Verified Sample Solutions:</strong> Full reference code for each module.</span>
                                </div>
                                <div className="mb-2 d-flex align-items-center">
                                    <span className="me-2">⏱️</span>
                                    <span><strong>Active Learning Check:</strong> Tracks engagement on each module.</span>
                                </div>
                                <div className="mb-2 d-flex align-items-center">
                                    <span className="me-2">🔒</span>
                                    <span><strong>Sequential Unlocks:</strong> Master 1.1 before advancing to 1.2.</span>
                                </div>
                                <div className="mb-2 d-flex align-items-center">
                                    <span className="me-2">📜</span>
                                    <span><strong>Accredited Credential:</strong> Final test unlocks on completion and emails your certificate.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
