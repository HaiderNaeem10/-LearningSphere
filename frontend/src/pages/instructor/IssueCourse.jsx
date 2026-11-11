import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const IssueCourse = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [issuedHistory, setIssuedHistory] = useState([]);
    
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
            alert('Access restricted to instructors and administrators.');
            navigate('/login');
            return;
        }

        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [coursesRes, studentsRes, historyRes] = await Promise.all([
                api.get('/courses/list.php'),
                api.get('/enrollments/issue-course.php'),
                api.get(`/enrollments/issue-course.php?action=issued_by_instructor&instructor_id=${user.id}`)
            ]);

            const instructorCourses = coursesRes.data.filter(c => 
                user.role === 'admin' || c.instructor_id === user.id || c.instructor === user.name
            );
            setCourses(instructorCourses.length > 0 ? instructorCourses : coursesRes.data);
            if (instructorCourses.length > 0) {
                setSelectedCourseId(instructorCourses[0].id);
            } else if (coursesRes.data.length > 0) {
                setSelectedCourseId(coursesRes.data[0].id);
            }

            setStudents(studentsRes.data || []);
            if (studentsRes.data.length > 0) {
                setSelectedStudentId(studentsRes.data[0].id);
            }

            setIssuedHistory(historyRes.data || []);
        } catch (err) {
            console.error('Failed to load issue course data', err);
            setError('Could not load students or courses list.');
        } finally {
            setLoading(false);
        }
    };

    const handleIssueCourse = async (e) => {
        e.preventDefault();
        setError('');
        setMessage(null);

        if (!selectedCourseId || !selectedStudentId) {
            setError('Please select both a course and a student.');
            return;
        }

        setIssuing(true);
        try {
            const response = await api.post('/enrollments/issue-course.php', {
                course_id: selectedCourseId,
                student_id: selectedStudentId,
                instructor_id: user.id
            });

            setMessage({
                type: 'success',
                text: response.data.message
            });

            // Reload history
            const historyRes = await api.get(`/enrollments/issue-course.php?action=issued_by_instructor&instructor_id=${user.id}`);
            setIssuedHistory(historyRes.data || []);
        } catch (err) {
            console.error('Failed to issue course', err);
            setError(err.response?.data?.message || 'Failed to issue course to student.');
        } finally {
            setIssuing(false);
        }
    };

    const filteredStudents = students.filter(s => 
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading Course Assignment console...</h5>
            </div>
        );
    }

    return (
        <div className="container py-4">
            {/* Header Banner */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <Link to="/instructor" className="text-decoration-none text-secondary small">
                        &larr; Back to Faculty Portal
                    </Link>
                    <h2 className="fw-bold text-dark mt-1 mb-0">🎓 Issue &amp; Assign Course to Student</h2>
                    <p className="text-secondary small mb-0">
                        Explicitly grant course curriculum, interactive modules, and assessments to a registered student.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/instructor/batch-enroll" className="btn btn-outline-primary btn-sm fw-bold">
                        📊 Batch Excel Assignment &rarr;
                    </Link>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger d-flex align-items-center rounded-3 p-3 mb-4">
                    <span className="me-2 fs-5">⚠️</span>
                    <div>{error}</div>
                </div>
            )}

            {message && (
                <div className="alert alert-success d-flex align-items-center rounded-3 p-3 mb-4">
                    <span className="me-2 fs-5">✅</span>
                    <div>{message.text}</div>
                </div>
            )}

            <div className="row g-4 mb-5">
                {/* Form Column */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white h-100">
                        <h4 className="fw-bold text-dark mb-3">Assign Course Form</h4>
                        <p className="text-muted small mb-4">
                            Select a target student and your course. Once issued, the student will see this under their <strong>"My Learning"</strong> dashboard as an instructor-assigned course.
                        </p>

                        <form onSubmit={handleIssueCourse}>
                            {/* Course Selection */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-dark">
                                    1. Select Course to Issue <span className="text-danger">*</span>
                                </label>
                                <select 
                                    className="form-select form-select-lg"
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    required
                                >
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.title} ({c.category || 'General'})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Student Search & Selection */}
                            <div className="mb-3">
                                <label className="form-label fw-bold small text-dark d-flex justify-content-between">
                                    <span>2. Select Target Student <span className="text-danger">*</span></span>
                                    <small className="text-muted">{students.length} students registered</small>
                                </label>
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm mb-2"
                                    placeholder="🔍 Search student by name or email..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                />
                                <select 
                                    className="form-select"
                                    size="6"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    required
                                >
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name} ({s.email}) — {s.enrolled_count} courses currently
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled>No students match your search.</option>
                                    )}
                                </select>
                            </div>

                            {/* Notification Info */}
                            <div className="p-3 bg-light rounded-3 border mb-4">
                                <div className="d-flex align-items-center mb-1">
                                    <span className="me-2 fs-5">👨‍🏫</span>
                                    <strong className="text-dark small">Course Attribution Notice</strong>
                                </div>
                                <p className="text-secondary small mb-0">
                                    The student will receive immediate access with progress tracking starting at 0%. Your name will appear on their dashboard as the authorizer.
                                </p>
                            </div>

                            <div className="d-grid">
                                <button 
                                    type="submit" 
                                    className="btn btn-warning btn-lg text-dark fw-bold shadow-sm"
                                    disabled={issuing || !selectedStudentId || !selectedCourseId}
                                >
                                    {issuing ? 'Issuing Course...' : '🎓 Issue / Assign Course Now'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Info / Quick Stats Column */}
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold text-dark mb-0">Recently Issued by You</h5>
                            <span className="badge bg-primary rounded-pill px-3 py-1">{issuedHistory.length} Total</span>
                        </div>

                        {issuedHistory.length > 0 ? (
                            <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
                                <table className="table table-hover align-middle small mb-0">
                                    <thead className="table-light sticky-top">
                                        <tr>
                                            <th>Student</th>
                                            <th>Course</th>
                                            <th>Progress</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issuedHistory.map(row => (
                                            <tr key={row.enrollment_id}>
                                                <td>
                                                    <strong className="d-block text-dark">{row.student_name}</strong>
                                                    <small className="text-muted">{row.student_email}</small>
                                                </td>
                                                <td>
                                                    <span className="text-truncate d-block" style={{ maxWidth: '160px' }} title={row.course_title}>
                                                        {row.course_title}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-1">
                                                        <div className="progress flex-grow-1" style={{ height: '6px', minWidth: '50px' }}>
                                                            <div 
                                                                className={`progress-bar ${parseFloat(row.progress_percentage) >= 100 ? 'bg-success' : 'bg-primary'}`}
                                                                style={{ width: `${row.progress_percentage}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="small fw-bold">{Math.round(parseFloat(row.progress_percentage))}%</span>
                                                    </div>
                                                </td>
                                                <td className="text-muted text-nowrap">
                                                    {row.enrolled_at ? new Date(row.enrolled_at).toLocaleDateString() : 'Active'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <span className="display-4 d-block mb-2">📋</span>
                                <p className="mb-0">No courses directly issued yet. Select a student and course on the left to issue one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssueCourse;
