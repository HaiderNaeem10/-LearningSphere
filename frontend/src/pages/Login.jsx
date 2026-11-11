import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { login } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const user = await login(email, password);
            if (user.role === 'admin') navigate('/admin');
            else if (user.role === 'instructor') navigate('/instructor');
            else navigate('/student');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid email or password.');
        } finally {
            setSubmitting(false);
        }
    };

    const fillCredentials = (demoEmail, demoPass) => {
        setEmail(demoEmail);
        setPassword(demoPass);
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-md-7 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
                        <div className="p-4 bg-primary text-white text-center">
                            <span className="fs-1 d-block mb-1">🎓</span>
                            <h3 className="fw-bold mb-1">Sign In to LearnSphere</h3>
                            <p className="small mb-0 opacity-75">Access student dashboards, interactive courses, and grading tools</p>
                        </div>

                        <div className="card-body p-4 p-md-5 bg-white">
                            {error && <div className="alert alert-danger py-2 small">{error}</div>}

                            <form onSubmit={handleSubmit}>
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
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        placeholder="••••••••"
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="d-grid mb-3">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary btn-lg fw-bold"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Authenticating...' : t('login')}
                                    </button>
                                </div>
                            </form>

                            {/* Demo Accounts 1-Click Fillers */}
                            <div className="border-top pt-3 mt-4">
                                <small className="text-secondary fw-bold d-block text-center mb-2">Quick Demo Accounts (1-Click Fill):</small>
                                <div className="d-flex flex-wrap gap-2 justify-content-center">
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-primary btn-sm rounded-pill fw-semibold"
                                        onClick={() => fillCredentials('student@learnsphere.com', 'Student@123')}
                                    >
                                        👨‍🎓 Student
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-success btn-sm rounded-pill fw-semibold"
                                        onClick={() => fillCredentials('instructor@learnsphere.com', 'Instructor@123')}
                                    >
                                        👨‍🏫 Instructor
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-danger btn-sm rounded-pill fw-semibold"
                                        onClick={() => fillCredentials('admin@learnsphere.com', 'Admin@123')}
                                    >
                                        ⚙️ Super-Admin
                                    </button>
                                </div>
                            </div>

                            <div className="text-center mt-4 pt-2 border-top">
                                <p className="mb-0 small text-secondary">
                                    Don't have an account yet? <Link to="/register" className="fw-bold text-primary">{t('register')}</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
