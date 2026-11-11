import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const CourseStudents = () => {
    const { courseId } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState(courseId || '');
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
            navigate('/login');
            return;
        }

        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/list.php');
                setCourses(response.data);
                if (!selectedCourseId && response.data.length > 0) {
                    setSelectedCourseId(response.data[0].id);
                }
            } catch (err) {
                console.error("Failed to load courses", err);
            }
        };

        fetchCourses();
    }, [user, navigate, selectedCourseId]);

    // Fetch students whenever selectedCourseId changes
    useEffect(() => {
        if (!selectedCourseId) return;

        const fetchStudents = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/enrollments/course-students.php?course_id=${selectedCourseId}`);
                setStudents(response.data);
            } catch (err) {
                console.error("Failed to load students", err);
                setError('Could not load student list.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [selectedCourseId]);

    const handleUnenroll = async (enrollmentId, studentName) => {
        const confirmUnenroll = window.confirm(`Are you sure you want to unenroll ${studentName} from this course?`);
        if (!confirmUnenroll) return;

        try {
            await api.post('/enrollments/unenroll.php', { enrollment_id: enrollmentId });
            setStudents(prev => prev.filter(s => s.enrollment_id !== enrollmentId));
            alert(`${studentName} was unenrolled.`);
        } catch (err) {
            alert('Failed to unenroll student.');
        }
    };

    const currentCourse = courses.find(c => String(c.id) === String(selectedCourseId));

    const filteredStudents = students.filter(s => 
        s.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <Link to="/instructor" className="text-decoration-none text-secondary small">
                        &larr; Back to Instructor Portal
                    </Link>
                    <h2 className="fw-bold text-dark mt-1 mb-0">📋 Class Enrollment Roster</h2>
                    <p className="text-secondary small mb-0">
                        Monitor student progress, track completion %, and manage enrolled cohorts.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/instructor/batch-enroll" className="btn btn-primary fw-bold">
                        👥 + Batch Enroll Students (Excel / CSV)
                    </Link>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Course Selector & Search Filter Bar */}
            <div className="card border-0 shadow-sm p-4 bg-white rounded-4 mb-4">
                <div className="row g-3 align-items-center">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Select Course</label>
                        <select 
                            className="form-select"
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                        >
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title} ({c.category})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Search Students</label>
                        <input 
                            type="text" 
                            className="form-control"
                            placeholder="Search by student name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Course Summary Banner */}
            {currentCourse && (
                <div className="p-3 mb-4 rounded-3 bg-primary-subtle border border-primary-subtle d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <strong className="text-primary-emphasis">{currentCourse.title}</strong>
                        <span className="badge bg-primary ms-2">{students.length} Total Enrolled</span>
                    </div>
                    <small className="text-secondary">Category: {currentCourse.category} • Difficulty: {currentCourse.difficulty}</small>
                </div>
            )}

            {/* Students Table */}
            <div className="card border-0 shadow-sm bg-white rounded-4 overflow-hidden">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="p-5 text-center">
                            <div className="spinner-border text-primary my-3"></div>
                            <p className="text-secondary small">Loading enrolled students...</p>
                        </div>
                    ) : filteredStudents.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th className="ps-4">Student</th>
                                        <th>Enrolled Date</th>
                                        <th style={{ width: '220px' }}>Course Progress</th>
                                        <th>Certificate</th>
                                        <th className="text-end pe-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map(st => {
                                        const progress = parseFloat(st.progress_percentage || 0);
                                        return (
                                            <tr key={st.enrollment_id}>
                                                <td className="ps-4">
                                                    <div className="fw-bold text-dark">{st.student_name}</div>
                                                    <small className="text-muted">{st.student_email}</small>
                                                </td>
                                                <td className="small text-secondary">
                                                    {new Date(st.enrolled_at).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-between small fw-bold mb-1">
                                                        <span>{Math.round(progress)}%</span>
                                                        <span className={progress >= 100 ? 'text-success' : 'text-secondary'}>
                                                            {progress >= 100 ? 'Completed' : 'In Progress'}
                                                        </span>
                                                    </div>
                                                    <div className="progress" style={{ height: '6px' }}>
                                                        <div 
                                                            className={`progress-bar ${progress >= 100 ? 'bg-success' : 'bg-primary'}`}
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {st.certificate_code ? (
                                                        <Link 
                                                            to={`/certificate/${st.certificate_code}`}
                                                            className="badge bg-success-subtle text-success text-decoration-none border border-success-subtle py-2 px-3"
                                                        >
                                                            🎓 {st.certificate_code}
                                                        </Link>
                                                    ) : (
                                                        <span className="badge bg-light text-secondary border">Not Earned Yet</span>
                                                    )}
                                                </td>
                                                <td className="text-end pe-4">
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => handleUnenroll(st.enrollment_id, st.student_name)}
                                                        title="Unenroll student from course"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-5 text-center">
                            <div className="display-4 mb-2">👥</div>
                            <h5>No Students Found</h5>
                            <p className="text-secondary small mb-3">
                                {searchTerm ? 'No enrolled students match your search query.' : 'There are no students enrolled in this course yet.'}
                            </p>
                            <Link to="/instructor/batch-enroll" className="btn btn-primary btn-sm fw-bold">
                                + Batch Enroll Students from Excel / CSV
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseStudents;
