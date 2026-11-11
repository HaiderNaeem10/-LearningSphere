import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const Certificate = () => {
    const { code } = useParams();
    const [certificate, setCertificate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCertificate = async () => {
            try {
                const response = await api.get(`/certificates/details.php?code=${code}`);
                setCertificate(response.data);
            } catch (err) {
                console.error("Failed to load certificate", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificate();
    }, [code]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <p className="text-secondary">Verifying digital certificate credentials...</p>
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
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <Link to="/student" className="btn btn-outline-secondary">
                    &larr; Back to My Dashboard
                </Link>
                <div className="d-flex gap-2">
                    <button className="btn btn-primary fw-bold px-4" onClick={handlePrint}>
                        🖨️ Print / Save as PDF
                    </button>
                    <Link to={`/courses/${certificate.course_id}`} className="btn btn-outline-primary">
                        View Course
                    </Link>
                </div>
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
                        {certificate.student_name}
                    </h2>

                    <p className="text-secondary fs-6 col-md-8 mx-auto mb-4">
                        for successfully completing all modules, lectures, hands-on tasks, and passing the rigorous final assessment for the specialized university course:
                    </p>

                    <h3 className="fw-bold text-dark mb-2">
                        {certificate.course_title}
                    </h3>
                    <span className="badge bg-primary-subtle text-primary mb-5 px-3 py-2">
                        Category: {certificate.category_name}
                    </span>

                    {/* Signatures & Verification Row */}
                    <div className="row align-items-end justify-content-between pt-4 border-top mt-4">
                        <div className="col-md-4 text-center text-md-start mb-3 mb-md-0">
                            <h6 className="fw-bold mb-0 text-dark">{certificate.instructor_name}</h6>
                            <small className="text-muted d-block">Lead Course Instructor</small>
                            <small className="text-secondary font-monospace">Verified Signature: <em>{certificate.instructor_name.split(' ')[0]}✓</em></small>
                        </div>

                        <div className="col-md-4 text-center mb-3 mb-md-0">
                            <div className="display-6">🏅</div>
                            <span className="badge bg-success">Verified & Authentic</span>
                        </div>

                        <div className="col-md-4 text-center text-md-end">
                            <small className="text-muted d-block">Issue Date:</small>
                            <strong className="text-dark d-block mb-1">
                                {new Date(certificate.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </strong>
                            <small className="text-secondary font-monospace d-block">
                                ID: {certificate.unique_code}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Certificate;
