import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Volunteer = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [area, setArea] = useState('peer_tutor');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="p-4 p-md-5 rounded-4 bg-white shadow-sm mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-success px-3 py-1 mb-2">Community Impact</span>
                    <h2 className="fw-bold text-dark mb-1">Student Volunteer &amp; Mentor Program</h2>
                    <p className="text-secondary mb-0">Empower fellow students, become a peer tutor, and assist with accessible educational content creation.</p>
                </div>
                <Link to="/courses" className="btn btn-outline-primary fw-bold">
                    &larr; Back to Catalog
                </Link>
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white">
                        <h4 className="fw-bold text-dark mb-3">Volunteer Application Form</h4>
                        {submitted ? (
                            <div className="p-4 bg-success-subtle border border-success rounded-3 text-center">
                                <span className="fs-1 d-block mb-2">🎉</span>
                                <h4 className="fw-bold text-success">Application Received!</h4>
                                <p className="text-secondary mb-0">
                                    Thank you, <strong>{name}</strong>! Our community coordinator will review your profile and contact you at <strong>{email}</strong> within 48 hours.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Full Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="e.g. Ayesha Khan" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        placeholder="e.g. ayesha@university.edu" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label small fw-bold">Area of Contribution</label>
                                    <select 
                                        className="form-select"
                                        value={area}
                                        onChange={(e) => setArea(e.target.value)}
                                    >
                                        <option value="peer_tutor">Peer Tutor (Code &amp; Math Guidance)</option>
                                        <option value="accessibility_advocate">Accessibility &amp; Voiceover Content Assistant</option>
                                        <option value="workshop_moderator">Workshop &amp; Webinar Moderator</option>
                                        <option value="curriculum_reviewer">Course Curriculum &amp; Quiz Reviewer</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg fw-bold px-4">
                                    Submit Volunteer Application
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <div className="col-lg-5">
                    <div className="card border-0 shadow-sm rounded-4 p-4 bg-light h-100">
                        <h5 className="fw-bold text-dark mb-3">Why Volunteer with LearnSphere?</h5>
                        <ul className="text-secondary small lh-lg ps-3 mb-4">
                            <li><strong>Official Certificate of Appreciation:</strong> Earn university leadership and service credits.</li>
                            <li><strong>Hands-on Mentorship:</strong> Strengthen your teaching, code review, and leadership skills.</li>
                            <li><strong>Network with Faculty:</strong> Work directly with top professors and tech experts.</li>
                            <li><strong>Accessibility Advocacy:</strong> Help build accessible education for students with disabilities and vision impairment.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Volunteer;
