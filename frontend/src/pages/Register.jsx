import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { register } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await register(name, email, password, role);
            setSuccess('Registration successful! Redirecting you to sign in...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <div className="p-4 bg-primary text-white text-center">
                            <span className="fs-1 d-block mb-1">🎓</span>
                            <h3 className="fw-bold mb-1">Create an Account</h3>
                            <p className="small mb-0 opacity-75">Join LearnSphere's interactive learning ecosystem</p>
                        </div>

                        <div className="card-body p-4 p-md-5 bg-white">
                            {error && <div className="alert alert-danger py-2 small">{error}</div>}
                            {success && <div className="alert alert-success py-2 small">{success}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="e.g. John Doe"
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        required 
                                        minLength="3" 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Email address</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        placeholder="name@university.edu"
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Password (Min. 8 characters)</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        placeholder="••••••••"
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                        minLength="8" 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Role in LearningSphere</label>
                                    <select 
                                        className="form-select" 
                                        value={role} 
                                        onChange={(e) => setRole(e.target.value)}
                                    >
                                        <option value="student">Student (Take courses, labs &amp; earn certificates)</option>
                                        <option value="instructor">Instructor (Author courses, assignments &amp; grade)</option>
                                        <option value="admin">Platform Administrator (System governance)</option>
                                    </select>
                                </div>
                                <div className="d-grid mb-3">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg fw-bold"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Registering...' : t('register')}
                                    </button>
                                </div>
                            </form>
                            <div className="text-center mt-3 pt-2 border-top">
                                <p className="mb-0 small text-secondary">
                                    Already have an account? <Link to="/login" className="fw-bold text-primary">{t('login')}</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
