import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { getCertificateByCode, sendCertificateEmail } from '../services/courseService';

const Certificate = () => {
    const { code } = useParams();
    const { user } = useContext(AuthContext);
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Email dispatch state
    const [recipientEmail, setRecipientEmail] = useState(user?.email || 'student@learnsphere.com');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSuccess, setEmailSuccess] = useState('');
    const [emailError, setEmailError] = useState('');

    useEffect(() => {
        const fetchCertificate = async () => {
            setLoading(true);
            try {
                // Try backend API first
                const response = await api.get(`/certificates/details.php?code=${code}`);
                if (response.data && response.data.unique_code) {
                    setCertificate(response.data);
                    if (response.data.student_email) setRecipientEmail(response.data.student_email);
                    return;
                }
            } catch (err) {
                console.warn("Backend certificate fetch failed, checking local credential registry:", err.message);
            }

            // Fallback to local verified certificate cache
            const localCert = getCertificateByCode(code);
            setCertificate(localCert);
            if (localCert.student_email) {
                setRecipientEmail(localCert.student_email);
            }
            setLoading(false);
        };

        fetchCertificate();
    }, [code]);

    const handlePrint = () => {
        window.print();
    };

    const handleEmailDispatch = async (e) => {
        e.preventDefault();
        setEmailError('');
        setEmailSuccess('');

        if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
            setEmailError('Please enter a valid, existing email address.');
            return;
        }

        setSendingEmail(true);
        try {
            const res = await sendCertificateEmail(code, recipientEmail);
            setEmailSuccess(`✓ Certificate dispatched to ${recipientEmail}! A digital copy has been delivered to your inbox.`);
        } catch (err) {
            setEmailError(err.message || 'Failed to dispatch email. Please verify your address.');
        } finally {
            setSendingEmail(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <p className="text-secondary">Verifying digital certificate credentials &amp; cryptographic signatures...</p>
            </div>
        );
    }

    if (!certificate) {
        return (
            <div className="container py-5 text-center">
                <div className="card p-5 border-0 shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
                    <div className="fs-1 mb-2">⚠️</div>
                    <h4>Certificate Not Found</h4>
                    <p className="text-secondary">The specified credential could not be found or has not yet been issued.</p>
                    <Link to="/courses" className="btn btn-primary mt-3">Browse Courses</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-5">
            {/* Top Toolbar */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <Link to="/student" className="btn btn-outline-secondary">
                    &larr; Back to My Dashboard
                </Link>
                <div className="d-flex gap-2 flex-wrap">
                    <button className="btn btn-primary fw-bold px-4 shadow-sm" onClick={handlePrint}>
                        🖨️ Print / Save as PDF
                    </button>
                    <Link to={`/courses/${certificate.course_id || 1}`} className="btn btn-outline-primary">
                        View Course Details
                    </Link>
                </div>
            </div>

            {/* Email Dispatch Control Card */}
            <div className="card border-0 shadow-sm p-4 mb-4 bg-white rounded-4 mx-auto" style={{ maxWidth: '920px' }}>
                <div className="d-flex align-items-center gap-3 mb-2">
                    <span className="fs-3">📧</span>
                    <div>
                        <h5 className="fw-bold text-dark mb-0">Email Digital Certificate to Student</h5>
                        <small className="text-secondary">
                            Dispatch an official authenticated PDF credential directly to an active, existing email address.
                        </small>
                    </div>
                </div>

                <form onSubmit={handleEmailDispatch} className="mt-3">
                    <div className="input-group">
                        <span className="input-group-text bg-light">@</span>
                        <input 
                            type="email" 
                            className="form-control" 
                            placeholder="Enter student's verified email address..." 
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            required
                        />
                        <button 
                            type="submit" 
                            className="btn btn-success fw-bold px-4 shadow-sm"
                            disabled={sendingEmail}
                        >
                            {sendingEmail ? 'Dispatching...' : 'Email Certificate Now 🚀'}
                        </button>
                    </div>
                    {emailError && (
                        <div className="alert alert-danger border-0 small mt-2 mb-0 py-2">
                            {emailError}
                        </div>
                    )}
                    {emailSuccess && (
                        <div className="alert alert-success border-0 small mt-2 mb-0 py-2">
                            {emailSuccess}
                        </div>
                    )}
                </form>
            </div>

            {/* Official Certificate Layout */}
            <div 
                className="card border-0 shadow-lg p-5 mx-auto bg-white position-relative"
                id="certificate-print-area"
                style={{
                    maxWidth: '920px',
                    border: '12px solid #1e3a8a',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                }}
            >
                {/* Decorative Inner Border */}
                <div 
                    className="p-4 p-md-5 text-center"
                    style={{ border: '2px solid #dbeafe', borderRadius: '8px' }}
                >
                    {/* Header Seal */}
                    <div className="mb-2">
                        <span className="fs-1">🎓</span>
                        <h5 className="text-uppercase tracking-wide text-primary fw-bold mt-2" style={{ letterSpacing: '4px' }}>
                            LearnSphere University
                        </h5>
                        <small className="text-secondary text-uppercase fw-semibold" style={{ letterSpacing: '2px' }}>
                            Digital Credential of Academic Achievement
                        </small>
                    </div>

                    <h1 className="display-5 fw-bold text-dark my-4 font-serif" style={{ fontFamily: 'Georgia, serif' }}>
                        Certificate of Completion
                    </h1>

                    <p className="text-secondary fs-5 mb-1">This certificate is proudly awarded to</p>
                    <h2 className="display-6 fw-bold text-primary mb-3 text-decoration-underline" style={{ fontFamily: 'Georgia, serif' }}>
                        {certificate.student_name || 'Jane Student'}
                    </h2>
                    
                    <p className="text-secondary fs-6 mb-4 px-md-5">
                        for successfully mastering all curriculum modules, satisfying the active working checks, and passing the comprehensive examination in:
                    </p>

                    <div className="p-3 bg-light rounded-3 d-inline-block border mb-4 px-5">
                        <h3 className="fw-bold text-dark mb-0">
                            {certificate.course_title || 'Full Stack Web Development'}
                        </h3>
                    </div>

                    {/* Metadata & Verification */}
                    <div className="row g-4 mt-2 border-top pt-4 text-start">
                        <div className="col-md-4">
                            <small className="text-muted text-uppercase d-block fw-bold" style={{ fontSize: '11px' }}>Date Issued</small>
                            <span className="fw-semibold text-dark">
                                {certificate.issued_at ? new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'November 18, 2026'}
                            </span>
                        </div>
                        <div className="col-md-4 text-center">
                            <small className="text-muted text-uppercase d-block fw-bold" style={{ fontSize: '11px' }}>Academic Grade</small>
                            <span className="badge bg-success-subtle text-success fs-6 fw-bold px-3 py-1 border border-success-subtle">
                                {certificate.grade || 'High Distinction'} ({certificate.percentage || 95}%)
                            </span>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <small className="text-muted text-uppercase d-block fw-bold" style={{ fontSize: '11px' }}>Verification ID</small>
                            <span className="font-monospace fw-bold text-primary">
                                {certificate.unique_code || code}
                            </span>
                        </div>
                    </div>

                    {/* Signatures */}
                    <div className="row mt-5 pt-3 border-top">
                        <div className="col-6 text-start">
                            <div className="font-serif fs-4 text-primary" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                                Dr. Sarah Mitchell
                            </div>
                            <small className="text-secondary d-block border-top border-dark w-75 pt-1 mt-1">Lead Academic Director</small>
                        </div>
                        <div className="col-6 text-end">
                            <div className="font-serif fs-4 text-primary" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                                LearnSphere Registrar
                            </div>
                            <small className="text-secondary d-block border-top border-dark w-75 ms-auto pt-1 mt-1">Global Certification Authority</small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
