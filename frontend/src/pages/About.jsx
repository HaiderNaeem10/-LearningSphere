import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-lg-9">
                    <div className="card shadow-sm border-0 p-4 p-md-5">
                        <span className="badge bg-primary-subtle text-primary mb-3 align-self-start px-3 py-2">
                            About The Project
                        </span>
                        <h2 className="fw-bold mb-3">LearnSphere – Learning Management System</h2>
                        <p className="lead text-secondary">
                            A production-grade full-stack LMS developed for a Software Engineering university semester project.
                        </p>
                        <hr className="my-4" />

                        <h4 className="fw-bold mt-3 mb-2">Architectural Highlights</h4>
                        <ul>
                            <li><strong>Frontend:</strong> React 19, React Router (Hash-based for Desktop), Bootstrap 5, Axios.</li>
                            <li><strong>Desktop Runtime:</strong> Electron with native Windows application window.</li>
                            <li><strong>Backend:</strong> PHP 8+ REST API architecture with PDO prepared statements and Bcrypt password hashing.</li>
                            <li><strong>Database:</strong> Normalized MySQL schema (3NF) supporting role-based access control (Admin, Instructor, Student).</li>
                        </ul>

                        <h4 className="fw-bold mt-4 mb-2">Core Roles & Capabilities</h4>
                        <div className="row g-3 mt-1 mb-4">
                            <div className="col-md-4">
                                <div className="border rounded p-3 h-100 bg-light">
                                    <h6 className="fw-bold text-primary">👨‍🎓 Student</h6>
                                    <small className="text-secondary">Enroll in courses, watch lessons, track progress %, submit quizzes, and earn certificates.</small>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="border rounded p-3 h-100 bg-light">
                                    <h6 className="fw-bold text-success">👨‍🏫 Instructor</h6>
                                    <small className="text-secondary">Create and manage courses, modules, video lessons, quizzes with scoring rules, and grade assignments.</small>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="border rounded p-3 h-100 bg-light">
                                    <h6 className="fw-bold text-danger">🛡️ Administrator</h6>
                                    <small className="text-secondary">Oversee platform users, approve instructors, manage categories, and audit system metrics.</small>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <Link to="/courses" className="btn btn-primary me-2">Browse Courses</Link>
                            <Link to="/" className="btn btn-outline-secondary">Back to Home</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
