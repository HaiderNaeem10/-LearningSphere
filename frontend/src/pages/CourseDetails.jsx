import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CourseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const { user } = useContext(AuthContext);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                const studentQuery = user ? `&student_id=${user.id}` : '';
                const response = await api.get(`/courses/details.php?id=${id}${studentQuery}`);
                setCourse(response.data);
            } catch (error) {
                console.error("Error fetching course details", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [id, user]);

    const handleEnroll = async () => {
        if (!user) {
            alert('Please login to enroll in this course.');
            navigate('/login');
            return;
        }
        setEnrolling(true);
        try {
            const response = await api.post('/enrollments/enroll.php', { 
                course_id: id,
                student_id: user.id
            });
            alert(response.data.message || 'Enrolled successfully!');
            navigate(`/learn/${id}`);
        } catch (error) {
            alert(error.response?.data?.message || 'Error enrolling in course.');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    if (!course) return <div className="container mt-5"><h3 className="text-center">Course not found</h3></div>;

    const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;

    return (
        <div className="container py-5">
            <div className="row g-4">
                {/* Main Content Info */}
                <div className="col-lg-8">
                    <nav aria-label="breadcrumb">
                        <ol className="breadcrumb">
                            <li className="breadcrumb-item"><Link to="/courses">Courses</Link></li>
                            <li className="breadcrumb-item active" aria-current="page">{course.category}</li>
                        </ol>
                    </nav>

                    <h1 className="fw-bold text-dark mb-3">{course.title}</h1>
                    <p className="lead text-secondary">{course.short_description}</p>
                    
                    <div className="d-flex mb-4 gap-2 flex-wrap align-items-center">
                        <span className="badge bg-primary px-3 py-2">{course.category}</span>
                        <span className="badge bg-secondary-subtle text-secondary px-3 py-2">👨‍🏫 Instructor: {course.instructor}</span>
                        <span className="badge bg-info-subtle text-info-emphasis px-3 py-2 text-capitalize">⚡ {course.difficulty}</span>
                        <span className="badge bg-light text-dark px-3 py-2 border">📚 {totalLessons} Lessons</span>
                    </div>

                    <div className="card p-4 border-0 shadow-sm mb-4">
                        <h4 className="fw-bold mb-3">About This Course</h4>
                        <p className="text-secondary lh-lg mb-0" style={{ whiteSpace: 'pre-line' }}>
                            {course.full_description}
                        </p>
                    </div>

                    {/* Modules & Syllabus */}
                    <div className="card p-4 border-0 shadow-sm">
                        <h4 className="fw-bold mb-3">Syllabus: What You Will Learn</h4>
                        {course.modules && course.modules.length > 0 ? (
                            <div className="accordion" id="courseAccordion">
                                {course.modules.map((mod, idx) => (
                                    <div className="accordion-item mb-2 border rounded overflow-hidden" key={mod.id}>
                                        <h2 className="accordion-header" id={`heading${mod.id}`}>
                                            <button className="accordion-button fw-bold bg-light text-dark" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse${mod.id}`}>
                                                Module {idx + 1}: {mod.title}
                                                <span className="badge bg-secondary-subtle text-secondary ms-auto me-3">{mod.lessons.length} Lessons</span>
                                            </button>
                                        </h2>
                                        <div id={`collapse${mod.id}`} className="accordion-collapse collapse show">
                                            <div className="accordion-body p-0">
                                                <ul className="list-group list-group-flush">
                                                    {mod.lessons.map(lesson => (
                                                        <li key={lesson.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                                                            <div>
                                                                <span className="me-2">▶️</span>
                                                                <span className="fw-semibold">{lesson.title}</span>
                                                                <small className="text-muted d-block ms-4">{lesson.description}</small>
                                                            </div>
                                                            <span className="badge bg-light text-dark border">{lesson.duration} mins</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted">Curriculum modules are being finalized.</p>
                        )}
                    </div>
                </div>

                {/* Right Enrollment & Action Card */}
                <div className="col-lg-4">
                    <div className="card shadow-sm border-0 sticky-top" style={{ top: '24px' }}>
                        <div className="card-body p-4 text-center">
                            <div className="display-4 mb-2">🎓</div>
                            
                            {course.is_enrolled ? (
                                <>
                                    <span className="badge bg-success-subtle text-success fs-6 mb-2 px-3 py-2">
                                        ✓ You Are Enrolled
                                    </span>
                                    <h4 className="card-title fw-bold">Continue Your Journey</h4>
                                    
                                    <div className="d-flex justify-content-between small fw-bold mt-3 mb-1">
                                        <span>Current Progress</span>
                                        <span>{Math.round(course.progress_percentage || 0)}%</span>
                                    </div>
                                    <div className="progress mb-4" style={{ height: '8px' }}>
                                        <div 
                                            className="progress-bar bg-success" 
                                            role="progressbar" 
                                            style={{ width: `${course.progress_percentage || 0}%` }}
                                        ></div>
                                    </div>

                                    <Link to={`/learn/${id}`} className="btn btn-primary btn-lg w-100 mb-2 fw-bold">
                                        ▶️ Go to Course Player
                                    </Link>
                                    <Link to={`/courses/${id}/quiz`} className="btn btn-outline-primary btn-lg w-100 mb-3">
                                        📝 Take Final Assessment
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <h4 className="card-title fw-bold">Enroll in Course</h4>
                                    <p className="card-text text-muted">
                                        Full access to lectures, notes, interactive quizzes, and verified certificate upon completion.
                                    </p>
                                    <button 
                                        onClick={handleEnroll} 
                                        className="btn btn-primary btn-lg w-100 mb-3 fw-bold shadow-sm"
                                        disabled={enrolling}
                                    >
                                        {enrolling ? 'Enrolling...' : 'Enroll Now (Free)'}
                                    </button>
                                </>
                            )}

                            <hr className="my-3" />
                            <div className="text-start small text-secondary">
                                <div className="mb-2">✓ <strong>Self-Paced:</strong> Learn at your own schedule</div>
                                <div className="mb-2">✓ <strong>Hands-on:</strong> Includes code exercises & quizzes</div>
                                <div className="mb-2">✓ <strong>Shareable:</strong> Verifiable digital certificate</div>
                                <div>✓ <strong>Direct Access:</strong> Lifetime access on desktop</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseDetails;
