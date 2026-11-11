import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const InstructorDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);

    // Modal States
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);

    // Module Form State
    const [moduleTitle, setModuleTitle] = useState('');
    const [prereqModuleId, setPrereqModuleId] = useState('');
    const [existingModules, setExistingModules] = useState([]);

    // Lesson Form State
    const [targetModuleId, setTargetModuleId] = useState('');
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonDuration, setLessonDuration] = useState('15');
    const [lessonVideoUrl, setLessonVideoUrl] = useState('');
    const [lessonTextContent, setLessonTextContent] = useState('');
    const [lessonDescription, setLessonDescription] = useState('');

    // Assignment Form State
    const [assignmentTitle, setAssignmentTitle] = useState('');
    const [assignmentDeadline, setAssignmentDeadline] = useState('');
    const [assignmentMaxMarks, setAssignmentMaxMarks] = useState('100');
    const [assignmentDescription, setAssignmentDescription] = useState('');
    const [assignmentResourceUrl, setAssignmentResourceUrl] = useState('');

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
            navigate('/login');
            return;
        }

        fetchInstructorCourses();
    }, [user, navigate]);

    const fetchInstructorCourses = async () => {
        setLoading(true);
        try {
            const response = await api.get('/courses/list.php');
            setCourses(response.data || []);
        } catch (err) {
            console.error("Failed to load courses", err);
        } finally {
            setLoading(false);
        }
    };

    // Open Add Module Modal
    const handleOpenModuleModal = async (course) => {
        setSelectedCourseForModal(course);
        setModuleTitle('');
        setPrereqModuleId('');
        try {
            const details = await api.get(`/courses/details.php?id=${course.id}`);
            setExistingModules(details.data.modules || []);
        } catch (err) {
            setExistingModules([]);
        }
        setShowModuleModal(true);
    };

    // Save New Module with Prerequisite Configuration
    const handleSaveModule = async (e) => {
        e.preventDefault();
        if (!moduleTitle.trim()) return;

        setSubmitting(true);
        try {
            await api.post('/modules/create.php', {
                course_id: selectedCourseForModal.id,
                title: moduleTitle,
                prerequisite_module_id: prereqModuleId ? parseInt(prereqModuleId) : null,
                order_index: existingModules.length + 1
            });
            alert("Module created successfully with prerequisite rules applied!");
            setShowModuleModal(false);
            fetchInstructorCourses();
        } catch (err) {
            alert("Failed to create module.");
        } finally {
            setSubmitting(false);
        }
    };

    // Open Add Lesson Modal
    const handleOpenLessonModal = async (course) => {
        setSelectedCourseForModal(course);
        setLessonTitle('');
        setLessonVideoUrl('');
        setLessonTextContent('');
        setLessonDescription('');
        try {
            const details = await api.get(`/courses/details.php?id=${course.id}`);
            setExistingModules(details.data.modules || []);
            if (details.data.modules?.length > 0) {
                setTargetModuleId(details.data.modules[0].id);
            }
        } catch (err) {
            setExistingModules([]);
        }
        setShowLessonModal(true);
    };

    // Save New Lesson
    const handleSaveLesson = async (e) => {
        e.preventDefault();
        if (!lessonTitle.trim() || !targetModuleId) return;

        setSubmitting(true);
        try {
            await api.post('/lessons/create.php', {
                module_id: parseInt(targetModuleId),
                title: lessonTitle,
                duration: parseInt(lessonDuration) || 15,
                video_url: lessonVideoUrl,
                text_content: lessonTextContent,
                description: lessonDescription
            });
            alert("Lesson added to curriculum successfully!");
            setShowLessonModal(false);
        } catch (err) {
            alert("Failed to add lesson.");
        } finally {
            setSubmitting(false);
        }
    };

    // Open Assignment Modal
    const handleOpenAssignmentModal = (course) => {
        setSelectedCourseForModal(course);
        setAssignmentTitle('');
        setAssignmentDeadline('');
        setAssignmentMaxMarks('100');
        setAssignmentDescription('');
        setAssignmentResourceUrl('');
        setShowAssignmentModal(true);
    };

    // Save New Assignment
    const handleSaveAssignment = async (e) => {
        e.preventDefault();
        if (!assignmentTitle.trim()) return;

        setSubmitting(true);
        try {
            const res = await api.post('/assignments/create.php', {
                course_id: selectedCourseForModal.id,
                title: assignmentTitle,
                deadline: assignmentDeadline || null,
                max_marks: parseInt(assignmentMaxMarks) || 100,
                description: assignmentDescription,
                resource_url: assignmentResourceUrl
            });
            const directUrl = `${window.location.origin}/assignments/${res.data.id || ''}`;
            alert(`Assignment created successfully!\n\nDirect Task Link:\n${directUrl}`);
            setShowAssignmentModal(false);
        } catch (err) {
            alert("Failed to create assignment.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading instructor portal...</h5>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Header Banner */}
            <div className="p-4 p-md-5 mb-4 rounded-4 text-white bg-dark shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3"
                 style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)' }}>
                <div>
                    <span className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold">Faculty &amp; Instructor Portal</span>
                    <h2 className="fw-bold mb-1">Welcome, Professor {user.name} 🎓</h2>
                    <p className="text-light opacity-75 mb-0">
                        Create interactive courses, configure prerequisite locking, upload learning media, and grade student assignments.
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Link to="/instructor/issue-course" className="btn btn-warning text-dark fw-bold px-3 shadow-sm d-flex align-items-center">
                        <span className="me-1">🎓</span> Issue Course to Student
                    </Link>
                    <Link to="/instructor/batch-enroll" className="btn btn-outline-light fw-bold px-3 shadow-sm d-flex align-items-center">
                        <span className="me-1">👥</span> Batch Excel Enrollment
                    </Link>
                    <Link to="/instructor/create-course" className="btn btn-light text-success fw-bold px-3 shadow-sm d-flex align-items-center">
                        <span className="me-1">➕</span> Create New Course
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 border-start border-success border-4">
                        <small className="text-secondary fw-semibold">Authored Courses</small>
                        <h2 className="fw-bold text-success mb-0">{courses.length}</h2>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 border-start border-primary border-4">
                        <small className="text-secondary fw-semibold">Prerequisite Engine</small>
                        <h5 className="fw-bold text-primary mb-0 mt-1">Multi-Tier Locking</h5>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 border-start border-warning border-4">
                        <small className="text-secondary fw-semibold">Batch Importer</small>
                        <h5 className="fw-bold text-warning mb-0 mt-1">Excel &amp; CSV Ready</h5>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 border-start border-info border-4">
                        <small className="text-secondary fw-semibold">Grading &amp; Rubrics</small>
                        <h5 className="fw-bold text-info mb-0 mt-1">Direct Task Links</h5>
                    </div>
                </div>
            </div>

            {/* Courses Roster */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <h4 className="fw-bold text-dark mb-0">📚 Active Courses &amp; Modules</h4>
                <div className="d-flex gap-2">
                    <Link to="/announcements" className="btn btn-outline-secondary btn-sm fw-bold">
                        📢 Announcements
                    </Link>
                    <Link to="/resources" className="btn btn-outline-secondary btn-sm fw-bold">
                        📦 Resources Hub
                    </Link>
                </div>
            </div>

            <div className="row g-4 mb-5">
                {courses.map(course => (
                    <div key={course.id} className="col-lg-6">
                        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column bg-white">
                            <div className="p-4 bg-light border-bottom">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="badge bg-primary-subtle text-primary">{course.category || 'General'}</span>
                                    <span className="badge bg-secondary-subtle text-secondary text-capitalize">{course.difficulty}</span>
                                </div>
                                <h5 className="fw-bold text-dark mb-1">{course.title}</h5>
                                <p className="text-secondary small mb-0">{course.short_description}</p>
                            </div>

                            <div className="card-body p-4 d-flex flex-column justify-content-between">
                                {/* Curriculum & Task Action Buttons */}
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    <button 
                                        className="btn btn-outline-primary btn-sm fw-bold"
                                        onClick={() => handleOpenModuleModal(course)}
                                        title="Add module and set prerequisite locking"
                                    >
                                        🔒 + Add Module &amp; Lock
                                    </button>
                                    <button 
                                        className="btn btn-outline-success btn-sm fw-bold"
                                        onClick={() => handleOpenLessonModal(course)}
                                        title="Add video lecture, notes, or code to this course"
                                    >
                                        ▶️ + Add Lesson
                                    </button>
                                    <button 
                                        className="btn btn-outline-warning text-dark btn-sm fw-bold"
                                        onClick={() => handleOpenAssignmentModal(course)}
                                        title="Create assignment and generate direct link"
                                    >
                                        📝 + Create Assignment
                                    </button>
                                </div>

                                <div className="pt-2 border-top d-flex flex-wrap gap-2">
                                    <Link 
                                        to={`/instructor/course-students/${course.id}`} 
                                        className="btn btn-primary btn-sm fw-bold flex-grow-1"
                                    >
                                        📋 Enrolled Students &amp; Grades
                                    </Link>
                                    <Link 
                                        to={`/instructor/batch-enroll`} 
                                        className="btn btn-outline-dark btn-sm fw-bold"
                                        title="Enroll batch of students from Excel/CSV"
                                    >
                                        👥 Batch Enroll
                                    </Link>
                                    <Link 
                                        to={`/courses/${course.id}`} 
                                        className="btn btn-outline-secondary btn-sm"
                                    >
                                        Course View
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL 1: ADD MODULE WITH PREREQUISITE LOCKING */}
            {showModuleModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <form onSubmit={handleSaveModule}>
                                <div className="modal-header bg-primary text-white border-0 py-3">
                                    <h5 className="modal-title fw-bold">🔒 Add Module &amp; Configure Prerequisites</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowModuleModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Course</label>
                                        <input type="text" className="form-control" value={selectedCourseForModal?.title || ''} disabled />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Module Title</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Module 2: Advanced State Management"
                                            value={moduleTitle}
                                            onChange={(e) => setModuleTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Prerequisite Module (Locking Rule)</label>
                                        <select 
                                            className="form-select"
                                            value={prereqModuleId}
                                            onChange={(e) => setPrereqModuleId(e.target.value)}
                                        >
                                            <option value="">No Prerequisite (Unlocked &amp; Available immediately)</option>
                                            {existingModules.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    Requires completion of: {m.title}
                                                </option>
                                            ))}
                                        </select>
                                        <small className="text-muted d-block mt-1">
                                            If set, students cannot open lessons in this module until they complete all lessons of the prerequisite module.
                                        </small>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModuleModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary px-4 fw-bold" disabled={submitting}>
                                        {submitting ? 'Saving...' : 'Create Module'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: ADD LESSON (VIDEO, CODE, NOTES) */}
            {showLessonModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <form onSubmit={handleSaveLesson}>
                                <div className="modal-header bg-success text-white border-0 py-3">
                                    <h5 className="modal-title fw-bold">▶️ Add Learning Lesson / Lecture</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowLessonModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="row g-3 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Target Module</label>
                                            <select 
                                                className="form-select"
                                                value={targetModuleId}
                                                onChange={(e) => setTargetModuleId(e.target.value)}
                                                required
                                            >
                                                {existingModules.map(m => (
                                                    <option key={m.id} value={m.id}>{m.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Estimated Duration (Minutes)</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                min="1"
                                                value={lessonDuration}
                                                onChange={(e) => setLessonDuration(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Lesson Title</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Asynchronous JavaScript &amp; Promise Chaining"
                                            value={lessonTitle}
                                            onChange={(e) => setLessonTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">YouTube Lecture / Video Embed URL</label>
                                        <input 
                                            type="url" 
                                            className="form-control" 
                                            placeholder="https://www.youtube.com/embed/..."
                                            value={lessonVideoUrl}
                                            onChange={(e) => setLessonVideoUrl(e.target.value)}
                                        />
                                        <small className="text-muted">Use embed format or leave blank for a text/interactive lab lesson.</small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Brief Description</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="Summary of what this lesson covers..."
                                            value={lessonDescription}
                                            onChange={(e) => setLessonDescription(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Lecture Notes &amp; Sample Code</label>
                                        <textarea 
                                            className="form-control font-monospace" 
                                            rows="6"
                                            placeholder="Write detailed explanations, syntax highlights, sample code snippets, and accessibility notes..."
                                            value={lessonTextContent}
                                            onChange={(e) => setLessonTextContent(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowLessonModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-success px-4 fw-bold" disabled={submitting}>
                                        {submitting ? 'Saving...' : 'Add Lesson'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: CREATE ASSIGNMENT & GENERATE DIRECT LINK */}
            {showAssignmentModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <form onSubmit={handleSaveAssignment}>
                                <div className="modal-header bg-warning text-dark border-0 py-3">
                                    <h5 className="modal-title fw-bold">📝 Create Assignment &amp; Task Link</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowAssignmentModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Assignment Title</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Build a Responsive Dashboard with React"
                                            value={assignmentTitle}
                                            onChange={(e) => setAssignmentTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Deadline / Cutoff Date</label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                value={assignmentDeadline}
                                                onChange={(e) => setAssignmentDeadline(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Maximum Marks</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                min="1"
                                                value={assignmentMaxMarks}
                                                onChange={(e) => setAssignmentMaxMarks(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Task Instructions &amp; Grading Rubric</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="4"
                                            placeholder="Detail the deliverables, acceptance criteria, and submission specifications..."
                                            value={assignmentDescription}
                                            onChange={(e) => setAssignmentDescription(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Resource / Starter File URL (Optional)</label>
                                        <input 
                                            type="url" 
                                            className="form-control" 
                                            placeholder="https://..."
                                            value={assignmentResourceUrl}
                                            onChange={(e) => setAssignmentResourceUrl(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowAssignmentModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-warning text-dark px-4 fw-bold" disabled={submitting}>
                                        {submitting ? 'Creating...' : 'Create & Generate Link'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;
