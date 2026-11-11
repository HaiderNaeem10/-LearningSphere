import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const AdminAddUser = ({ onUserAdded, isEmbedded = false }) => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student'); // 'student', 'instructor', 'admin'
    const [isApproved, setIsApproved] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successData, setSuccessData] = useState(null);
    const [copied, setCopied] = useState(false);

    // Helper to generate a friendly random password
    const handleGeneratePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
        let generated = '';
        for (let i = 0; i < 10; i++) {
            generated += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(generated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessData(null);
        setCopied(false);

        if (!name.trim() || !email.trim() || !password) {
            setError('Please provide full name, email, and password.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/admin/users.php', {
                action: 'create_user',
                name: name.trim(),
                email: email.trim(),
                password: password,
                role: role,
                is_approved: isApproved ? 1 : 0
            });

            const created = res.data.user;
            setSuccessData({
                name: created.name,
                email: created.email,
                role: created.role,
                password: password
            });

            // Reset form fields
            setName('');
            setEmail('');
            setPassword('');

            if (onUserAdded) {
                onUserAdded(created);
            }
        } catch (err) {
            console.error('Failed to add user:', err);
            setError(err.response?.data?.message || 'Failed to create member account. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCopyCredentials = () => {
        if (!successData) return;
        const text = `LearnSphere LMS Login Credentials\nRole: ${successData.role.toUpperCase()}\nName: ${successData.name}\nEmail: ${successData.email}\nPassword: ${successData.password}\nLogin URL: http://localhost:5173/login`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className={isEmbedded ? '' : 'container py-4'}>
            {!isEmbedded && (
                <div className="mb-4 d-flex justify-content-between align-items-center">
                    <div>
                        <span className="badge bg-primary text-white mb-1">Admin User Provisioning</span>
                        <h2 className="fw-bold mb-1">Add New Platform Member</h2>
                        <p className="text-muted small mb-0">Directly create Student or Teacher accounts with specific dashboard access.</p>
                    </div>
                    <Link to="/admin" className="btn btn-outline-secondary btn-sm fw-bold">
                        &larr; Back to Admin Center
                    </Link>
                </div>
            )}

            <div className="row g-4">
                {/* Form Column */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                        <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                            <span className="fs-2 me-3">👤➕</span>
                            <div>
                                <h4 className="fw-bold text-dark mb-0">Register Member &amp; Assign Role</h4>
                                <small className="text-secondary">Provide credentials and determine permissions immediately.</small>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger d-flex align-items-center py-2 px-3 small rounded-3 mb-4">
                                <span className="me-2 fs-5">⚠️</span>
                                <div>{error}</div>
                            </div>
                        )}

                        {successData && (
                            <div className="alert alert-success rounded-3 p-3 mb-4 border-success">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="fw-bold text-success mb-1">✅ Member Account Created Successfully!</h6>
                                        <p className="small mb-2 text-dark">
                                            <strong>{successData.name}</strong> was registered with <span className="badge bg-primary text-capitalize">{successData.role}</span> access.
                                        </p>
                                        <div className="p-2 bg-light rounded border font-monospace small mb-2">
                                            <div><strong>Email:</strong> {successData.email}</div>
                                            <div><strong>Password:</strong> {successData.password}</div>
                                            <div><strong>Role:</strong> {successData.role}</div>
                                        </div>
                                    </div>
                                    <button 
                                        type="button" 
                                        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-success'} fw-bold`}
                                        onClick={handleCopyCredentials}
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy Details'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Member Role Selection Cards */}
                            <div className="mb-4">
                                <label className="form-label fw-bold small text-dark d-block">
                                    Select Member Access Role <span className="text-danger">*</span>
                                </label>
                                <div className="row g-2">
                                    <div className="col-md-6">
                                        <div 
                                            className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${role === 'student' ? 'border-primary bg-primary-subtle text-primary shadow-sm' : 'border-secondary-subtle bg-light text-dark'}`}
                                            onClick={() => setRole('student')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center mb-1">
                                                <input 
                                                    type="radio" 
                                                    name="roleSelection" 
                                                    checked={role === 'student'} 
                                                    onChange={() => setRole('student')}
                                                    className="form-check-input me-2 mt-0"
                                                    id="role-student"
                                                />
                                                <label htmlFor="role-student" className="fw-bold mb-0 cursor-pointer">
                                                    🎓 Student Access
                                                </label>
                                            </div>
                                            <small className="d-block text-secondary mt-1" style={{ fontSize: '0.82rem' }}>
                                                Enrolls in courses, attends video lectures, solves quizzes, submits assignments &amp; earns certificates.
                                            </small>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div 
                                            className={`p-3 rounded-3 border cursor-pointer h-100 transition-all ${role === 'instructor' ? 'border-warning bg-warning-subtle text-dark shadow-sm' : 'border-secondary-subtle bg-light text-dark'}`}
                                            onClick={() => setRole('instructor')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center mb-1">
                                                <input 
                                                    type="radio" 
                                                    name="roleSelection" 
                                                    checked={role === 'instructor'} 
                                                    onChange={() => setRole('instructor')}
                                                    className="form-check-input me-2 mt-0"
                                                    id="role-instructor"
                                                />
                                                <label htmlFor="role-instructor" className="fw-bold mb-0 cursor-pointer">
                                                    👨‍🏫 Teacher / Instructor Access
                                                </label>
                                            </div>
                                            <small className="d-block text-secondary mt-1" style={{ fontSize: '0.82rem' }}>
                                                Creates courses, locks modules with prerequisites, uploads materials, authors quizzes &amp; grades students.
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Name */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-dark">
                                    Full Name <span className="text-danger">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder={role === 'instructor' ? 'e.g. Prof. Tariq Mahmood' : 'e.g. Fatima Ali'}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    minLength="2"
                                />
                            </div>

                            {/* Email Address */}
                            <div className="mb-3">
                                <label className="form-label small fw-bold text-dark">
                                    Email Address (Username) <span className="text-danger">*</span>
                                </label>
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    placeholder={role === 'instructor' ? 'instructor@university.edu' : 'student@university.edu'}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <small className="text-muted">The member will use this email address to log in.</small>
                            </div>

                            {/* Password with generator */}
                            <div className="mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="form-label small fw-bold text-dark mb-0">
                                        Initial Password <span className="text-danger">*</span>
                                    </label>
                                    <button 
                                        type="button" 
                                        className="btn btn-link btn-sm text-decoration-none p-0 fw-bold"
                                        onClick={handleGeneratePassword}
                                    >
                                        🎲 Generate Random Password
                                    </button>
                                </div>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control font-monospace" 
                                        placeholder="Min. 6 characters (e.g. Student@2026)"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength="6"
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-secondary" 
                                        onClick={handleGeneratePassword}
                                        title="Auto Generate"
                                    >
                                        🎲 Auto
                                    </button>
                                </div>
                            </div>

                            {/* Instant Approval Toggle */}
                            <div className="form-check form-switch mb-4 p-3 bg-light rounded-3 border">
                                <input 
                                    className="form-check-input ms-0 me-3" 
                                    type="checkbox" 
                                    id="isApprovedSwitch"
                                    checked={isApproved}
                                    onChange={(e) => setIsApproved(e.target.checked)}
                                />
                                <label className="form-check-label fw-bold text-dark" htmlFor="isApprovedSwitch">
                                    Activate &amp; Approve Account Immediately
                                </label>
                                <small className="d-block text-secondary mt-1">
                                    {isApproved 
                                        ? 'Member will be able to log in right away with this email and password.' 
                                        : 'Account will remain in Pending status until explicitly approved by an admin.'}
                                </small>
                            </div>

                            {/* Submit Button */}
                            <div className="d-grid">
                                <button 
                                    type="submit" 
                                    className={`btn btn-lg fw-bold ${role === 'instructor' ? 'btn-warning text-dark' : 'btn-primary'} shadow-sm`}
                                    disabled={submitting}
                                >
                                    {submitting 
                                        ? 'Creating Member...' 
                                        : `Create & Enroll Member as ${role === 'instructor' ? 'Teacher / Instructor' : 'Student'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column: Permission & Feature Highlights */}
                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                        <h5 className="fw-bold text-dark mb-3">Access Capabilities Comparison</h5>
                        
                        <div className={`p-3 rounded-3 mb-3 border ${role === 'student' ? 'border-primary bg-primary-subtle' : 'bg-light'}`}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <strong className="text-primary fs-6">🎓 Student Access Scope:</strong>
                                {role === 'student' && <span className="badge bg-primary">Selected</span>}
                            </div>
                            <ul className="small mb-0 ps-3 text-secondary">
                                <li className="mb-1">Access to enrolled courses and video lectures</li>
                                <li className="mb-1">Interactive Coursera-style module checklist &amp; lessons</li>
                                <li className="mb-1">Module quizzes &amp; final certification assessments</li>
                                <li className="mb-1">Assignment submissions &amp; gradebook report</li>
                                <li>Verifiable certificate generation upon course completion</li>
                            </ul>
                        </div>

                        <div className={`p-3 rounded-3 border ${role === 'instructor' ? 'border-warning bg-warning-subtle' : 'bg-light'}`}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <strong className="text-dark fs-6">👨‍🏫 Teacher / Instructor Access Scope:</strong>
                                {role === 'instructor' && <span className="badge bg-warning text-dark">Selected</span>}
                            </div>
                            <ul className="small mb-0 ps-3 text-secondary">
                                <li className="mb-1">Course creation &amp; curriculum authoring</li>
                                <li className="mb-1">Video lecture links, text notes &amp; code samples</li>
                                <li className="mb-1">Module prerequisite locking &amp; sequencing system</li>
                                <li className="mb-1">Quiz creator with multiple-choice questions &amp; marks</li>
                                <li className="mb-1">Assignment management &amp; student grading</li>
                                <li>Batch student enrollment via Excel/CSV import</li>
                            </ul>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-light border-start border-4 border-info">
                        <h6 className="fw-bold text-dark mb-1">💡 Pro-Tip for Administrators</h6>
                        <p className="small text-secondary mb-0">
                            Once created, you can also change any member's role at any time from the <strong>User Management</strong> table by selecting another option in their Role dropdown.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAddUser;
