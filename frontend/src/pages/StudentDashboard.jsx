import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

const StudentDashboard = () => {
    const { user } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('enrolled'); // 'enrolled', 'catalog', 'certificates'
    const [learningFilter, setLearningFilter] = useState('all'); // 'all', 'assigned', 'in_progress', 'completed'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const loadDashboardData = async () => {
            try {
                const [enrolledRes, coursesRes, annRes] = await Promise.all([
                    api.get(`/enrollments/my-courses.php?student_id=${user.id}`),
                    api.get('/courses/list.php'),
                    api.get('/announcements/list.php?limit=3')
                ]);
                setEnrollments(enrolledRes.data || []);
                setAllCourses(coursesRes.data || []);
                setAnnouncements(annRes.data || []);
            } catch (err) {
                console.error("Failed to load student dashboard data", err);
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading your learning dashboard...</h5>
            </div>
        );
    }

    const instructorAssignedCourses = enrollments.filter(e => e.assigned_by || e.assigned_by_name);
    const inProgressCourses = enrollments.filter(e => parseFloat(e.progress_percentage) < 100);
    const completedCourses = enrollments.filter(e => parseFloat(e.progress_percentage) >= 100);
    const certificates = enrollments.filter(e => e.certificate_code);

    const displayedEnrollments = enrollments.filter(e => {
        if (learningFilter === 'assigned') return e.assigned_by || e.assigned_by_name;
        if (learningFilter === 'in_progress') return parseFloat(e.progress_percentage) < 100;
        if (learningFilter === 'completed') return parseFloat(e.progress_percentage) >= 100;
        return true;
    });

    // Filtered courses based on search bar
    const filteredCourses = allCourses.filter(c => 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructor?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="container py-4">
            {/* Top Welcome Banner */}
            <div className="p-4 p-md-5 mb-4 rounded-4 text-white bg-dark shadow-sm d-flex justify-content-between align-items-center flex-wrap gap-3"
                 style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
                <div>
                    <span className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold">🎓 My Learning Portal</span>
                    <h2 className="fw-bold mb-1">Welcome back, {user.name}!</h2>
                    <p className="text-light opacity-75 mb-0">Track your assigned curriculum, interactive modules, assessments, and certifications.</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Link to="/gradebook" className="btn btn-outline-light fw-bold px-3">
                        📊 Gradebook
                    </Link>
                    <Link to="/performance" className="btn btn-outline-light fw-bold px-3">
                        📈 Performance
                    </Link>
                    <Link to="/courses" className="btn btn-warning text-dark fw-bold px-3 shadow-sm">
                        + Browse Catalog
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-md-3">
                    <div className="card p-3 border-0 shadow-sm text-center h-100 rounded-3 border-start border-primary border-4 cursor-pointer"
                         onClick={() => { setActiveTab('enrolled'); setLearningFilter('all'); }}>
                        <small className="text-secondary fw-semibold">All Enrolled</small>
                        <h2 className="fw-bold text-primary mb-0">{enrollments.length}</h2>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card p-3 border-0 shadow-sm text-center h-100 rounded-3 border-start border-warning border-4 cursor-pointer"
                         onClick={() => { setActiveTab('enrolled'); setLearningFilter('assigned'); }}>
                        <small className="text-secondary fw-semibold">👨‍🏫 Instructor Assigned</small>
                        <h2 className="fw-bold text-warning mb-0">{instructorAssignedCourses.length}</h2>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card p-3 border-0 shadow-sm text-center h-100 rounded-3 border-start border-success border-4 cursor-pointer"
                         onClick={() => { setActiveTab('enrolled'); setLearningFilter('completed'); }}>
                        <small className="text-secondary fw-semibold">Completed Courses</small>
                        <h2 className="fw-bold text-success mb-0">{completedCourses.length}</h2>
                    </div>
                </div>
                <div className="col-6 col-md-3">
                    <div className="card p-3 border-0 shadow-sm text-center h-100 rounded-3 border-start border-info border-4 cursor-pointer"
                         onClick={() => setActiveTab('certificates')}>
                        <small className="text-secondary fw-semibold">Certificates Earned</small>
                        <h2 className="fw-bold text-info mb-0">{certificates.length}</h2>
                    </div>
                </div>
            </div>

            {/* Platform Announcements Banner (if any) */}
            {announcements.length > 0 && (
                <div className="card border-0 shadow-sm p-3 mb-4 bg-light rounded-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold text-dark d-flex align-items-center">
                            <span className="me-2">📢</span> Recent Announcements
                        </span>
                        <Link to="/announcements" className="small text-decoration-none fw-semibold">View All Announcements &rarr;</Link>
                    </div>
                    <div className="row g-2">
                        {announcements.map(ann => (
                            <div className="col-md-4" key={ann.id}>
                                <div className="p-2 bg-white rounded border">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className={`badge ${ann.priority === 'urgent' ? 'bg-danger' : ann.priority === 'high' ? 'bg-warning text-dark' : 'bg-primary'} small`}>
                                            {ann.priority}
                                        </span>
                                        <small className="text-muted">{ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ''}</small>
                                    </div>
                                    <strong className="d-block text-truncate small">{ann.title}</strong>
                                    <small className="text-secondary d-block text-truncate">{ann.content}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Tabs Navigation & Course Search Bar */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                <ul className="nav nav-pills gap-2">
                    <li className="nav-item">
                        <button 
                            className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'enrolled' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                            onClick={() => setActiveTab('enrolled')}
                        >
                            📚 My Active Learning ({enrollments.length})
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'catalog' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                            onClick={() => setActiveTab('catalog')}
                        >
                            🔍 Course Catalog &amp; Outlines
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'certificates' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                            onClick={() => setActiveTab('certificates')}
                        >
                            🏆 Certificates ({certificates.length})
                        </button>
                    </li>
                </ul>

                {/* Live Search Bar */}
                <div style={{ maxWidth: '320px', width: '100%' }}>
                    <div className="input-group shadow-sm">
                        <span className="input-group-text bg-white border-end-0">🔎</span>
                        <input 
                            type="text" 
                            className="form-control border-start-0" 
                            placeholder="Search courses or topics..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Tab 1: Enrolled Courses */}
            {activeTab === 'enrolled' && (
                <div>
                    {/* Sub-filter pills for My Learning */}
                    <div className="d-flex gap-2 mb-4 flex-wrap align-items-center">
                        <span className="small fw-bold text-secondary me-1">Filter Learning:</span>
                        <button 
                            className={`btn btn-sm rounded-pill fw-bold px-3 ${learningFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setLearningFilter('all')}
                        >
                            All Courses ({enrollments.length})
                        </button>
                        <button 
                            className={`btn btn-sm rounded-pill fw-bold px-3 ${learningFilter === 'assigned' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                            onClick={() => setLearningFilter('assigned')}
                        >
                            👨‍🏫 Assigned by Instructor ({instructorAssignedCourses.length})
                        </button>
                        <button 
                            className={`btn btn-sm rounded-pill fw-bold px-3 ${learningFilter === 'in_progress' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setLearningFilter('in_progress')}
                        >
                            ⏳ In Progress ({inProgressCourses.length})
                        </button>
                        <button 
                            className={`btn btn-sm rounded-pill fw-bold px-3 ${learningFilter === 'completed' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setLearningFilter('completed')}
                        >
                            ✓ Completed ({completedCourses.length})
                        </button>
                    </div>

                    {displayedEnrollments.length > 0 ? (
                        <div className="row g-4">
                            {displayedEnrollments.map(c => {
                                const progress = parseFloat(c.progress_percentage) || 0;
                                const isDone = progress >= 100;
                                return (
                                    <div key={c.enrollment_id} className="col-md-6 col-lg-4">
                                        <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden d-flex flex-column bg-white">
                                            <div className="position-relative">
                                                <img 
                                                    src={c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'} 
                                                    alt={c.title} 
                                                    className="w-100" 
                                                    style={{ height: '160px', objectFit: 'cover' }} 
                                                />
                                                <span className={`badge position-absolute top-0 end-0 m-2 ${isDone ? 'bg-success' : 'bg-primary'}`}>
                                                    {isDone ? 'Completed' : 'In Progress'}
                                                </span>
                                            </div>

                                            <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                                                <div>
                                                    {/* Instructor Assignment Badge */}
                                                    {c.assigned_by_name ? (
                                                        <div className="badge bg-warning-subtle text-dark border border-warning px-2 py-1 mb-2 d-inline-flex align-items-center">
                                                            <span className="me-1">👨‍🏫</span> Assigned by Prof. {c.assigned_by_name}
                                                        </div>
                                                    ) : (
                                                        <div className="badge bg-light text-secondary border px-2 py-1 mb-2 d-inline-flex align-items-center">
                                                            <span>Self Enrolled</span>
                                                        </div>
                                                    )}

                                                    <small className="text-secondary d-block mb-1">
                                                        Instructor: <strong>{c.instructor_name || c.instructor || 'Faculty Lead'}</strong>
                                                    </small>
                                                    <h5 className="fw-bold text-dark mb-2">{c.title}</h5>
                                                    <p className="text-muted small mb-3">{c.short_description}</p>
                                                </div>

                                                <div>
                                                    <div className="d-flex justify-content-between small fw-bold mb-1">
                                                        <span>Curriculum Progress</span>
                                                        <span>{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="progress mb-3" style={{ height: '8px' }}>
                                                        <div 
                                                            className={`progress-bar ${isDone ? 'bg-success' : 'bg-primary'}`} 
                                                            role="progressbar" 
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>

                                                    <div className="d-flex gap-2">
                                                        <Link to={`/learn/${c.course_id}`} className="btn btn-primary btn-sm flex-fill fw-bold">
                                                            {isDone ? 'Review Course' : 'Continue Learning &rarr;'}
                                                        </Link>
                                                        {c.certificate_code && (
                                                            <Link to={`/certificate/${c.certificate_code}`} className="btn btn-outline-success btn-sm fw-bold">
                                                                🏆 Certificate
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm p-5 text-center rounded-4 bg-white">
                            <div className="display-4 mb-2">📚</div>
                            <h4 className="fw-bold">No courses match this filter</h4>
                            <p className="text-secondary mb-3">
                                {learningFilter === 'assigned' 
                                    ? 'No instructor-assigned courses found yet. When your teacher assigns a course, it will appear here!'
                                    : "You haven't enrolled in any courses yet. Explore our top-tier catalog now!"}
                            </p>
                            <div className="d-flex gap-2 justify-content-center">
                                {learningFilter !== 'all' && (
                                    <button className="btn btn-outline-primary px-3 fw-bold" onClick={() => setLearningFilter('all')}>
                                        View All Enrolled Courses
                                    </button>
                                )}
                                <Link to="/courses" className="btn btn-primary px-4 fw-bold">
                                    Browse Catalog Now
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tab 2: Course Catalog & Outlines */}
            {activeTab === 'catalog' && (
                <div>
                    <div className="row g-4">
                        {filteredCourses.map(course => (
                            <div className="col-md-6 col-lg-4" key={course.id}>
                                <div className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden d-flex flex-column">
                                    <img 
                                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'} 
                                        alt={course.title} 
                                        className="w-100" 
                                        style={{ height: '160px', objectFit: 'cover' }} 
                                    />
                                    <div className="p-3 flex-grow-1 d-flex flex-column justify-content-between">
                                        <div>
                                            <div className="d-flex justify-content-between mb-1">
                                                <span className="badge bg-secondary-subtle text-secondary">{course.category || 'General'}</span>
                                                <span className="badge bg-info-subtle text-info-emphasis text-capitalize">{course.difficulty}</span>
                                            </div>
                                            <h5 className="fw-bold text-dark mt-2 mb-1">{course.title}</h5>
                                            <small className="text-secondary d-block mb-2">Instructor: {course.instructor}</small>
                                            <p className="text-muted small mb-3">{course.short_description}</p>
                                        </div>

                                        <div className="d-flex gap-2">
                                            <Link to={`/courses/${course.id}`} className="btn btn-outline-primary btn-sm flex-fill fw-bold">
                                                📋 View Outline
                                            </Link>
                                            <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm flex-fill fw-bold">
                                                Enroll Now
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab 3: Certificates */}
            {activeTab === 'certificates' && (
                <div>
                    {certificates.length > 0 ? (
                        <div className="row g-4">
                            {certificates.map(cert => (
                                <div className="col-md-6 col-lg-4" key={cert.certificate_code}>
                                    <div className="card h-100 border-0 shadow-sm rounded-3 p-4 bg-white text-center border-top border-success border-4">
                                        <div className="fs-1 mb-2">🏆</div>
                                        <h5 className="fw-bold text-dark mb-1">{cert.title}</h5>
                                        <small className="text-secondary d-block mb-3">Issued to {user.name}</small>
                                        <div className="bg-light p-2 rounded small mb-3 font-monospace">
                                            ID: {cert.certificate_code}
                                        </div>
                                        <Link to={`/certificate/${cert.certificate_code}`} className="btn btn-success fw-bold w-100">
                                            View &amp; Print Certificate
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm p-5 text-center rounded-3 bg-white">
                            <div className="display-4 mb-2">🎖️</div>
                            <h4 className="fw-bold">No certificates earned yet</h4>
                            <p className="text-secondary mb-3">Complete all lessons in a course and pass its final quiz with at least 80% to earn your official certificate!</p>
                            <Link to="/courses" className="btn btn-primary px-4 fw-bold mx-auto">
                                Start Learning
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
