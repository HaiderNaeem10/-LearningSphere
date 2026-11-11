import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Performance = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [enrollments, setEnrollments] = useState([]);
    const [gradeData, setGradeData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        const loadPerformance = async () => {
            try {
                const [enrolledRes, gradeRes] = await Promise.all([
                    api.get(`/enrollments/my-courses.php?student_id=${user.id}`),
                    api.get(`/gradebook/student-grades.php?student_id=${user.id}`)
                ]);
                setEnrollments(enrolledRes.data || []);
                setGradeData(gradeRes.data || null);
            } catch (err) {
                console.error("Failed to load performance metrics", err);
            } finally {
                setLoading(false);
            }
        };

        loadPerformance();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Computing performance analytics...</h5>
            </div>
        );
    }

    const summary = gradeData?.summary || { total_courses: 0, completed_courses: 0, overall_average: 0 };
    const courses = gradeData?.courses || [];

    // Calculate total completed lessons / modules
    const totalEnrollments = enrollments.length;
    const avgProgress = totalEnrollments > 0 
        ? Math.round(enrollments.reduce((acc, curr) => acc + (parseFloat(curr.progress_percentage) || 0), 0) / totalEnrollments) 
        : 0;

    return (
        <div className="container py-4">
            {/* Page Header */}
            <div className="p-4 rounded-4 bg-white shadow-sm mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-success px-3 py-1 mb-2">Student Analytics</span>
                    <h2 className="fw-bold text-dark mb-1">Learning Performance &amp; Progress Dashboard</h2>
                    <p className="text-secondary mb-0">Consolidated breakdown of course completion, quiz scores, assignment outcomes, and milestones.</p>
                </div>
                <div className="d-flex gap-2">
                    <Link to="/gradebook" className="btn btn-outline-primary fw-bold">
                        Detailed Gradebook &rarr;
                    </Link>
                </div>
            </div>

            {/* Visual KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-bottom border-primary border-4">
                        <span className="fs-3 mb-1">📈</span>
                        <small className="text-secondary fw-semibold">Average Course Progress</small>
                        <h2 className="fw-bold text-primary mb-0">{avgProgress}%</h2>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                            <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${avgProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-bottom border-success border-4">
                        <span className="fs-3 mb-1">🎯</span>
                        <small className="text-secondary fw-semibold">Overall Academic Average</small>
                        <h2 className="fw-bold text-success mb-0">{summary.overall_average}%</h2>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                            <div className="progress-bar bg-success" role="progressbar" style={{ width: `${summary.overall_average}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-bottom border-warning border-4">
                        <span className="fs-3 mb-1">📚</span>
                        <small className="text-secondary fw-semibold">Courses In Progress</small>
                        <h2 className="fw-bold text-warning mb-0">{totalEnrollments - summary.completed_courses}</h2>
                        <span className="small text-muted mt-2 d-block">Active tracks</span>
                    </div>
                </div>

                <div className="col-md-3 col-6">
                    <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-bottom border-info border-4">
                        <span className="fs-3 mb-1">🏆</span>
                        <small className="text-secondary fw-semibold">Completed Courses</small>
                        <h2 className="fw-bold text-info mb-0">{summary.completed_courses}</h2>
                        <span className="small text-muted mt-2 d-block">Satisfied prerequisites</span>
                    </div>
                </div>
            </div>

            {/* Course-by-Course Progress & Performance Grid */}
            <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
                <h4 className="fw-bold text-dark mb-4">Course-Level Performance Matrix</h4>

                {courses.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Course</th>
                                    <th>Completion</th>
                                    <th>Final Quiz Score</th>
                                    <th>Assignments Completed</th>
                                    <th>Course Average</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(course => {
                                    const enMatch = enrollments.find(e => parseInt(e.course_id) === parseInt(course.course_id));
                                    const progress = enMatch ? parseFloat(enMatch.progress_percentage) : 0;
                                    const assnCount = course.assignments ? course.assignments.length : 0;
                                    const gradedAssnCount = course.assignments ? course.assignments.filter(a => a.status === 'graded').length : 0;

                                    return (
                                        <tr key={course.course_id}>
                                            <td className="fw-bold">
                                                <Link to={`/courses/${course.course_id}`} className="text-decoration-none text-dark">
                                                    {course.course_title}
                                                </Link>
                                                <small className="text-secondary d-block fw-normal">{course.instructor}</small>
                                            </td>
                                            <td style={{ minWidth: '160px' }}>
                                                <div className="d-flex justify-content-between small fw-bold mb-1">
                                                    <span>{Math.round(progress)}%</span>
                                                </div>
                                                <div className="progress" style={{ height: '6px' }}>
                                                    <div 
                                                        className={`progress-bar ${progress >= 100 ? 'bg-success' : 'bg-primary'}`} 
                                                        role="progressbar" 
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td>
                                                {course.quiz ? (
                                                    <span className={`badge ${course.quiz.is_passed ? 'bg-success' : 'bg-danger'} px-3 py-2`}>
                                                        {course.quiz.percentage}% ({course.quiz.score}/{course.quiz.total_marks})
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary-subtle text-secondary">Not Attempted</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className="badge bg-light text-dark border">
                                                    {gradedAssnCount} of {assnCount} Graded
                                                </span>
                                            </td>
                                            <td>
                                                <strong className="text-primary fs-6">{course.course_average}%</strong>
                                            </td>
                                            <td>
                                                <Link to={`/learn/${course.course_id}`} className="btn btn-outline-primary btn-sm fw-bold">
                                                    Resume &rarr;
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-4 text-muted">
                        No course records found. Enroll in a course to view detailed metrics.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Performance;
