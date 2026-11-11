import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthContext } from './context/AuthContext';

import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import CoursePlayer from './pages/CoursePlayer';
import QuizPage from './pages/QuizPage';
import Certificate from './pages/Certificate';
import StudentDashboard from './pages/StudentDashboard';
import Gradebook from './pages/Gradebook';
import Performance from './pages/Performance';
import Announcements from './pages/Announcements';
import Resources from './pages/Resources';
import AssignmentDetails from './pages/AssignmentDetails';
import Events from './pages/Events';
import Volunteer from './pages/Volunteer';

import InstructorDashboard from './pages/instructor/InstructorDashboard';
import CreateCourse from './pages/instructor/CreateCourse';
import BatchEnrollment from './pages/instructor/BatchEnrollment';
import CourseStudents from './pages/instructor/CourseStudents';
import IssueCourse from './pages/instructor/IssueCourse';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAddUser from './pages/admin/AdminAddUser';

import AccessibilityToolbar from './components/AccessibilityToolbar';
import PlatformWalkthroughModal from './components/PlatformWalkthroughModal';

const App = () => {
    const { loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                    <h5 className="mt-3 text-secondary">Initializing LearnSphere LMS...</h5>
                </div>
            </div>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100 bg-light">
            <Navbar />
            
            {/* Global Interactive Walkthrough Modal with Voiceover & Video */}
            <PlatformWalkthroughModal />

            {/* Global Floating Accessibility Toolbar */}
            <AccessibilityToolbar />

            <main className="flex-grow-1">
                <Routes>
                    {/* Primary Public Routes with Standard URL Paths */}
                    <Route path="/" element={<Home />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/courses/:id" element={<CourseDetails />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/volunteer" element={<Volunteer />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    
                    {/* Student Learning, Interactive Modules & Assessments */}
                    <Route path="/learn/:id" element={<CoursePlayer />} />
                    <Route path="/courses/:courseId/quiz" element={<QuizPage />} />
                    <Route path="/certificate/:code" element={<Certificate />} />
                    <Route path="/student" element={<StudentDashboard />} />
                    <Route path="/my-learning" element={<StudentDashboard />} />
                    <Route path="/gradebook" element={<Gradebook />} />
                    <Route path="/performance" element={<Performance />} />
                    <Route path="/announcements" element={<Announcements />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/assignments/:id" element={<AssignmentDetails />} />

                    {/* Instructor Portal & Management */}
                    <Route path="/instructor" element={<InstructorDashboard />} />
                    <Route path="/instructor/create-course" element={<CreateCourse />} />
                    <Route path="/instructor/issue-course" element={<IssueCourse />} />
                    <Route path="/instructor/batch-enroll" element={<BatchEnrollment />} />
                    <Route path="/instructor/course-students" element={<CourseStudents />} />
                    <Route path="/instructor/course-students/:courseId" element={<CourseStudents />} />
                    
                    {/* Administrator Management */}
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/add-user" element={<AdminAddUser />} />
                    <Route path="/admin/signup" element={<AdminAddUser />} />
                    
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
            </main>

            <footer className="bg-dark text-white text-center py-3 mt-auto">
                <div className="container">
                    <p className="mb-0 small text-light opacity-75">
                        &copy; 2026 LearnSphere LMS • Universal Accessibility, Voiceover &amp; Interactive Learning System. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default App;
