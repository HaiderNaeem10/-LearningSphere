import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Gradebook = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [gradeData, setGradeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchGrades = async () => {
            try {
                const response = await api.get(`/gradebook/student-grades.php?student_id=${user.id}`);
                setGradeData(response.data);
            } catch (err) {
                console.error("Failed to load gradebook", err);
            } finally {
                setLoading(false);
            }
        };

        fetchGrades();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading academic gradebook...</h5>
            </div>
        );
    }

    const summary = gradeData?.summary || { total_courses: 0, completed_courses: 0, overall_average: 0 };
    const courses = gradeData?.courses || [];

    // Compute letter grade
    const getLetterGrade = (pct) => {
        if (pct >= 90) return { grade: 'A+', color: 'text-success' };
        if (pct >= 85) return { grade: 'A', color: 'text-success' };
        if (pct >= 80) return { grade: 'B+', color: 'text-primary' };
        if (pct >= 75) return { grade: 'B', color: 'text-primary' };
        if (pct >= 70) return { grade: 'C+', color: 'text-warning' };
        if (pct >= 60) return { grade: 'C', color: 'text-warning' };
        return { grade: 'F', color: 'text-danger' };
    };

    const overallGrade = getLetterGrade(summary.overall_average);

    return (
        <div className="container py-4">
            {/* Header Banner */}
            <div className="p-4 rounded-4 bg-white shadow-sm mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-primary px-3 py-1 mb-2">Academic Record</span>
                    <h2 className="fw-bold text-dark mb-1">Student Gradebook &amp; Performance</h2>
                    <p className="text-secondary mb-0">Official academic transcript of completed quizzes, projects, and assignments.</p>
                </div>
                <div>
                    <button 
                        className="btn btn-outline-primary fw-bold"
                        onClick={() => window.print()}
                    >
                        🖨️ Print Transcript
                    </button>
                </div>
            </div>

            {/* Consolidated Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center">
                        <small className="text-secondary">Courses Registered</small>
                        <h3 className="fw-bold text-primary mb-0">{summary.total_courses}</h3>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center">
                        <small className="text-secondary">Completed Courses</small>
                        <h3 className="fw-bold text-success mb-0">{summary.completed_courses}</h3>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center">
                        <small className="text-secondary">Overall Average</small>
                        <h3 className="fw-bold text-dark mb-0">{summary.overall_average}%</h3>
                    </div>
                </div>
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center">
                        <small className="text-secondary">Cumulative Standing</small>
                        <h3 className={`fw-bold mb-0 ${overallGrade.color}`}>{overallGrade.grade}</h3>
                    </div>
                </div>
            </div>

            {/* Detailed Course Breakdowns */}
            {courses.length > 0 ? (
                <div className="d-flex flex-column gap-4">
                    {courses.map(course => (
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden" key={course.course_id}>
                            <div className="card-header bg-light py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <div>
                                    <h5 className="fw-bold text-dark mb-1">{course.course_title}</h5>
                                    <small className="text-secondary">Instructor: {course.instructor}</small>
                                </div>
                                <div className="d-flex align-items-center gap-3">
                                    <div className="text-end">
                                        <small className="text-secondary d-block">Course Average</small>
                                        <span className="fw-bold text-primary fs-5">{course.course_average}%</span>
                                    </div>
                                    <Link to={`/learn/${course.course_id}`} className="btn btn-outline-primary btn-sm fw-bold">
                                        Go to Course
                                    </Link>
                                </div>
                            </div>

                            <div className="card-body p-4">
                                <div className="row g-4">
                                    {/* Final Quiz Status */}
                                    <div className="col-lg-5 border-end">
                                        <h6 className="fw-bold text-dark mb-3">🎓 Final Assessment Result</h6>
                                        {course.quiz ? (
                                            <div className="p-3 bg-light rounded-3 border">
                                                <div className="d-flex justify-content-between align-items-center mb-2">
                                                    <strong className="text-dark">{course.quiz.quiz_title}</strong>
                                                    <span className={`badge ${course.quiz.is_passed ? 'bg-success' : 'bg-danger'}`}>
                                                        {course.quiz.is_passed ? 'PASSED' : 'RETAKE REQUIRED'}
                                                    </span>
                                                </div>
                                                <div className="d-flex justify-content-between text-secondary small mb-2">
                                                    <span>Score Earned:</span>
                                                    <strong className="text-dark">{course.quiz.score} / {course.quiz.total_marks} ({course.quiz.percentage}%)</strong>
                                                </div>
                                                <div className="d-flex justify-content-between text-secondary small">
                                                    <span>Attempted Date:</span>
                                                    <span>{course.quiz.attempted_at ? new Date(course.quiz.attempted_at).toLocaleDateString() : 'N/A'}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-light rounded-3 text-center text-muted small">
                                                Quiz not yet attempted.
                                                <div className="mt-2">
                                                    <Link to={`/courses/${course.course_id}/quiz`} className="btn btn-sm btn-primary">
                                                        Attempt Quiz
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignments Breakdown */}
                                    <div className="col-lg-7">
                                        <h6 className="fw-bold text-dark mb-3">📝 Assignment Submissions &amp; Grades</h6>
                                        {course.assignments && course.assignments.length > 0 ? (
                                            <div className="table-responsive">
                                                <table className="table table-sm table-bordered align-middle mb-0">
                                                    <thead className="table-light small">
                                                        <tr>
                                                            <th>Assignment</th>
                                                            <th>Marks</th>
                                                            <th>Status</th>
                                                            <th>Feedback</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="small">
                                                        {course.assignments.map(assn => (
                                                            <tr key={assn.id}>
                                                                <td className="fw-semibold">
                                                                    <Link to={`/assignments/${assn.id}`} className="text-decoration-none text-primary">
                                                                        {assn.title}
                                                                    </Link>
                                                                </td>
                                                                <td>
                                                                    {assn.grade !== null ? `${assn.grade} / ${assn.max_marks}` : `— / ${assn.max_marks}`}
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${assn.status === 'graded' ? 'bg-success' : assn.status === 'submitted' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                                                                        {assn.status}
                                                                    </span>
                                                                </td>
                                                                <td className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                                                                    {assn.feedback || 'Pending evaluation'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-muted small mb-0">No assignments registered for this course.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card p-5 border-0 shadow-sm text-center rounded-4 bg-white">
                    <div className="display-4 mb-2">📊</div>
                    <h4 className="fw-bold">No Grade Records Yet</h4>
                    <p className="text-secondary mb-3">Enroll in courses and take quizzes to populate your official gradebook.</p>
                    <Link to="/courses" className="btn btn-primary px-4 fw-bold mx-auto">
                        Explore Courses
                    </Link>
                </div>
            )}
        </div>
    );
};

export default Gradebook;
