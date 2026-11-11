import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { AccessibilityContext } from '../context/AccessibilityContext';
import { useTranslation } from '../context/LanguageContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { isFullscreen, toggleFullscreen } = useContext(AccessibilityContext);
    const { lang, setLang, toggleLanguage, t, availableLanguages } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/home');
    };

    const handleBack = () => {
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1);
        } else {
            navigate('/home');
        }
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm sticky-top">
            <div className="container-fluid px-lg-4">
                <div className="d-flex align-items-center">
                    {/* Universal Back Button */}
                    <button 
                        className="btn btn-warning text-dark btn-sm fw-bold me-2 px-3 py-1 rounded-pill shadow-sm d-flex align-items-center border-0"
                        onClick={handleBack}
                        title="Go Back to Previous Page"
                        aria-label="Go Back"
                    >
                        <span className="me-1 fw-bold fs-6">←</span>
                        <span>Back</span>
                    </button>

                    <Link className="navbar-brand fw-bold d-flex align-items-center mb-0" to="/home">
                        <span className="me-2 fs-4">🎓</span>
                        <span>LearnSphere</span>
                    </Link>
                </div>

                <button 
                    className="navbar-toggler border-0" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarContent"
                    aria-controls="navbarContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0 align-items-lg-center">
                        <li className="nav-item">
                            <Link className={`nav-link px-2 ${isActive('/home') ? 'active fw-bold' : ''}`} to="/home">
                                {t('home')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-2 ${isActive('/courses') ? 'active fw-bold' : ''}`} to="/courses">
                                {t('courses')}
                            </Link>
                        </li>

                        {/* Instructor Specific Links */}
                        {user && user.role === 'instructor' && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link px-2 text-warning ${isActive('/instructor') ? 'active fw-bold' : ''}`} to="/instructor">
                                        👨‍🏫 Faculty Portal
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link px-2 text-white fw-bold ${isActive('/instructor/issue-course') ? 'active text-warning' : ''}`} to="/instructor/issue-course">
                                        🎓 Issue Course
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link px-2 ${isActive('/instructor/batch-enroll') ? 'active fw-bold' : ''}`} to="/instructor/batch-enroll">
                                        👥 Batch Enroll
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Admin Specific Links */}
                        {user && user.role === 'admin' && (
                            <>
                                <li className="nav-item">
                                    <Link className={`nav-link px-2 text-warning ${isActive('/admin') ? 'active fw-bold' : ''}`} to="/admin">
                                        ⚙️ Admin Center
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className={`nav-link px-2 text-white fw-bold ${isActive('/admin/signup') ? 'active text-warning' : ''}`} to="/admin/signup">
                                        👤➕ Add Member
                                    </Link>
                                </li>
                            </>
                        )}

                        {/* Common Community & Resources Links (Only show Resources here if not a student, since students have it in their top-left dropdown) */}
                        {(!user || user.role !== 'student') && (
                            <li className="nav-item">
                                <Link className={`nav-link px-2 ${isActive('/resources') ? 'active fw-bold' : ''}`} to="/resources">
                                    {t('resources')}
                                </Link>
                            </li>
                        )}
                        <li className="nav-item">
                            <Link className={`nav-link px-2 ${isActive('/announcements') ? 'active fw-bold' : ''}`} to="/announcements">
                                {t('announcements')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-2 ${isActive('/events') ? 'active fw-bold' : ''}`} to="/events">
                                {t('events')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-2 ${isActive('/volunteer') ? 'active fw-bold' : ''}`} to="/volunteer">
                                {t('volunteer')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link px-2 ${isActive('/about') ? 'active fw-bold' : ''}`} to="/about">
                                {t('about')}
                            </Link>
                        </li>
                    </ul>

                    {/* Right-side Utilities & Profile */}
                    <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0 flex-wrap">
                        {/* Student Specific: My Learning Dropdown on Right Side */}
                        {user && user.role === 'student' && (
                            <div className="dropdown me-lg-2">
                                <div className="btn-group shadow-sm">
                                    <Link 
                                        to="/student"
                                        className={`btn btn-sm ${isActive('/student') ? 'btn-warning text-dark fw-bold' : 'btn-outline-light text-warning fw-bold'} rounded-start-pill px-3 py-1 d-flex align-items-center`}
                                        title="Go to My Learning"
                                    >
                                        <span className="me-1">📊</span> {t('myLearning')}
                                    </Link>
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-light text-warning dropdown-toggle dropdown-toggle-split rounded-end-pill px-2 py-1"
                                        data-bs-toggle="dropdown" 
                                        aria-expanded="false"
                                        title="Student Modules: Gradebook, Performance, Resources"
                                    >
                                        <span className="visually-hidden">Toggle Dropdown</span>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 py-1">
                                        <li>
                                            <Link className={`dropdown-item py-2 fw-semibold ${isActive('/gradebook') ? 'active bg-primary text-white' : ''}`} to="/gradebook">
                                                📝 {t('gradebook')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item py-2 fw-semibold ${isActive('/performance') ? 'active bg-primary text-white' : ''}`} to="/performance">
                                                📈 {t('performance')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className={`dropdown-item py-2 fw-semibold ${isActive('/resources') ? 'active bg-primary text-white' : ''}`} to="/resources">
                                                📁 {t('resources')}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        )}
                        {/* Multi-Language Dropdown */}
                        <div className="dropdown">
                            <button 
                                className="btn btn-outline-light btn-sm fw-bold px-2 py-1 rounded-pill dropdown-toggle d-flex align-items-center"
                                type="button"
                                id="languageDropdown"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                                title="Select Language"
                            >
                                <span className="me-1">🌐</span>
                                <span>{availableLanguages?.find(l => l.code === lang)?.label || 'English'}</span>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 py-1" aria-labelledby="languageDropdown">
                                {availableLanguages?.map(item => (
                                    <li key={item.code}>
                                        <button 
                                            type="button"
                                            className={`dropdown-item py-2 d-flex align-items-center justify-content-between ${lang === item.code ? 'active bg-primary text-white fw-bold' : ''}`}
                                            onClick={() => setLang(item.code)}
                                        >
                                            <span>{item.flag} {item.name}</span>
                                            {lang === item.code && <span className="ms-2">✓</span>}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Fullscreen Button */}
                        <button 
                            className="btn btn-outline-light btn-sm px-2 py-1 rounded-pill"
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit Fullscreen (Alt+F)' : 'Fullscreen Mode (Alt+F)'}
                            aria-label="Toggle Fullscreen"
                        >
                            {isFullscreen ? '🗗' : '⛶'}
                        </button>

                        {/* User Login / Register or Profile Dropdown */}
                        {!user ? (
                            <div className="d-flex gap-2 ms-lg-2">
                                <Link className="btn btn-outline-light btn-sm fw-bold px-3 py-1 rounded-pill" to="/login">
                                    {t('login')}
                                </Link>
                                <Link className="btn btn-warning text-dark fw-bold btn-sm px-3 py-1 rounded-pill shadow-sm" to="/register">
                                    {t('register')}
                                </Link>
                            </div>
                        ) : (
                            <div className="dropdown ms-lg-2">
                                <button 
                                    className="btn btn-outline-light btn-sm dropdown-toggle fw-bold d-flex align-items-center rounded-pill px-3 py-1"
                                    type="button" 
                                    id="userMenuButton" 
                                    data-bs-toggle="dropdown" 
                                    aria-expanded="false"
                                >
                                    <span className="badge bg-warning text-dark me-2 text-capitalize">{user.role}</span>
                                    <span>{user.name}</span>
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 py-2" aria-labelledby="userMenuButton">
                                    <li className="px-3 py-1 text-muted small border-bottom mb-1">
                                        Signed in as <strong className="d-block text-truncate text-dark">{user.email}</strong>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item py-2" to={user.role === 'admin' ? '/admin' : user.role === 'instructor' ? '/instructor' : '/student'}>
                                            📊 Dashboard ({user.role})
                                        </Link>
                                    </li>
                                    {user.role === 'student' && (
                                        <>
                                            <li><Link className="dropdown-item py-2 fw-semibold" to="/student">📚 My Learning (Assigned Courses)</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/gradebook">📝 My Gradebook &amp; Scores</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/performance">📈 Performance Metrics</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/resources">📁 Course Resources &amp; Downloads</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/announcements">📢 Campus Announcements</Link></li>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><Link className="dropdown-item py-2 text-primary fw-semibold" to="/courses">🔎 Explore Course Catalog</Link></li>
                                        </>
                                    )}
                                    {user.role === 'instructor' && (
                                        <>
                                            <li><Link className="dropdown-item py-2 fw-semibold" to="/instructor">👨‍🏫 Faculty Control Center</Link></li>
                                            <li><Link className="dropdown-item py-2 text-warning-emphasis fw-bold" to="/instructor/issue-course">🎓 Issue Course to Student</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/instructor/batch-enroll">📊 Automated Excel Batch Enrollment</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/instructor/create-course">➕ Create New Course</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/instructor/course-students">👥 Course Students &amp; Roster</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/announcements">📢 Broadcast Announcement</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/resources">📁 Course Resources Hub</Link></li>
                                        </>
                                    )}
                                    {user.role === 'admin' && (
                                        <>
                                            <li><Link className="dropdown-item py-2 fw-semibold" to="/admin">⚙️ Platform Super-Admin</Link></li>
                                            <li><Link className="dropdown-item py-2 fw-bold text-primary" to="/admin/signup">👤➕ Add Member (Student/Teacher)</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/admin">👥 User Management &amp; Approvals</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/admin">📚 Course Moderation &amp; Catalogs</Link></li>
                                            <li><Link className="dropdown-item py-2" to="/announcements">📢 Platform Broadcasts</Link></li>
                                        </>
                                    )}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item text-danger py-2 fw-semibold" onClick={handleLogout}>
                                            🚪 {t('logout')}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
