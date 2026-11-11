import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const AssignmentDetails = () => {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [assignment, setAssignment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    // Student Submission Form State
    const [submissionText, setSubmissionText] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Instructor Grading State
    const [gradingId, setGradingId] = useState(null);
    const [marksInput, setMarksInput] = useState('');
    const [feedbackInput, setFeedbackInput] = useState('');
    const [savingGrade, setSavingGrade] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadAssignment();
    }, [id, user, navigate]);

    const loadAssignment = async () => {
        setLoading(true);
        try {
            const url = user ? `/assignments/details.php?id=${id}&student_id=${user.id}` : `/assignments/details.php?id=${id}`;
            const response = await api.get(url);
            setAssignment(response.data);
            if (response.data.my_submission) {
                setSubmissionText(response.data.my_submission.submission_text || '');
                setFileUrl(response.data.my_submission.file_url || '');
            }
        } catch (err) {
            console.error("Failed to load assignment", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!submissionText.trim() && !fileUrl.trim()) {
            alert("Please enter your solution notes, answer text, or repository URL.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/assignments/submit.php', {
                assignment_id: parseInt(id),
                student_id: user.id,
                submission_text: submissionText,
                file_url: fileUrl || 'https://learnsphere.edu/repo'
            });
            alert("Assignment submitted successfully!");
            loadAssignment();
        } catch (err) {
            alert("Failed to submit assignment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleGradeSubmission = async (submissionId) => {
        if (marksInput === '' || isNaN(marksInput)) {
            alert("Please enter a valid numeric score.");
            return;
        }

        setSavingGrade(true);
        try {
            await api.post('/assignments/grade.php', {
                submission_id: submissionId,
                marks_obtained: parseInt(marksInput),
                feedback: feedbackInput
            });
            alert("Grade saved successfully!");
            setGradingId(null);
            setMarksInput('');
            setFeedbackInput('');
            loadAssignment();
        } catch (err) {
            alert("Failed to record grade.");
        } finally {
            setSavingGrade(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading assignment workspace...</h5>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="container py-5 text-center">
                <h4>Assignment not found.</h4>
                <Link to="/courses" className="btn btn-primary mt-3">Back to Courses</Link>
            </div>
        );
    }

    const isInstructorOrAdmin = user && (user.role === 'instructor' || user.role === 'admin');
    const mySub = assignment.my_submission;

    return (
        <div className="container py-4">
            {/* Header & Direct Task Sharing */}
            <div className="p-4 p-md-5 rounded-4 bg-white shadow-sm mb-4 border">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge bg-primary px-3 py-1">Assignment Task</span>
                            <span className="badge bg-secondary-subtle text-secondary">{assignment.course_title}</span>
                            <span className="badge bg-info-subtle text-info-emphasis">Max Marks: {assignment.max_marks}</span>
                        </div>
                        <h2 className="fw-bold text-dark mb-2">{assignment.title}</h2>
                        <small className="text-muted d-block">
                            Instructor: <strong>{assignment.instructor_name}</strong> • Due: <strong>{assignment.deadline || 'No cutoff'}</strong>
                        </small>
                    </div>

                    {/* Direct Link Share Button */}
                    <div>
                        <button 
                            className={`btn ${copied ? 'btn-success' : 'btn-outline-primary'} fw-bold px-3 shadow-sm`}
                            onClick={handleCopyLink}
                            title="Copy direct link to share with students"
                        >
                            {copied ? '✓ Link Copied to Clipboard!' : '🔗 Share Direct Task Link'}
                        </button>
                    </div>
                </div>

                <hr className="my-4" />

                {/* Assignment Instructions / Description */}
                <div>
                    <h5 className="fw-bold text-dark mb-2">Instructions &amp; Requirements</h5>
                    <div className="p-3 bg-light rounded-3 text-secondary lh-lg mb-3" style={{ whiteSpace: 'pre-line' }}>
                        {assignment.description}
                    </div>

                    {assignment.resource_url && (
                        <div className="mt-2">
                            <a 
                                href={assignment.resource_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn btn-outline-secondary btn-sm"
                            >
                                📄 Download Starter Files / Specification
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* Student View: Submission Workspace & Feedback */}
            {!isInstructorOrAdmin && (
                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <h4 className="fw-bold text-dark mb-3">
                                {mySub ? 'Your Submission' : 'Submit Your Solution'}
                            </h4>

                            {mySub && (
                                <div className={`p-3 rounded-3 mb-4 ${
                                    mySub.status === 'graded' ? 'bg-success-subtle border border-success' : 'bg-warning-subtle border border-warning'
                                }`}>
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <strong className="text-dark">
                                            Status: <span className="text-uppercase">{mySub.status}</span>
                                        </strong>
                                        <small className="text-muted">Submitted on: {new Date(mySub.submitted_at).toLocaleString()}</small>
                                    </div>
                                    {mySub.status === 'graded' && (
                                        <div className="mt-2">
                                            <h4 className="fw-bold text-success mb-1">
                                                Grade: {mySub.marks_obtained} / {assignment.max_marks}
                                            </h4>
                                            {mySub.feedback && (
                                                <div className="p-2 bg-white rounded border small mt-2">
                                                    <strong>Instructor Feedback:</strong> {mySub.feedback}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleSubmitAssignment}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Solution Notes / Written Code</label>
                                    <textarea 
                                        className="form-control font-monospace" 
                                        rows="8"
                                        placeholder="Paste your solution, write code, or explain your methodology..."
                                        value={submissionText}
                                        onChange={(e) => setSubmissionText(e.target.value)}
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-4">
                                    <label className="form-label small fw-bold">GitHub Repository or Project Link (Optional)</label>
                                    <input 
                                        type="url" 
                                        className="form-control" 
                                        placeholder="https://github.com/your-username/your-project"
                                        value={fileUrl}
                                        onChange={(e) => setFileUrl(e.target.value)}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary btn-lg fw-bold px-4"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : mySub ? 'Update Submission' : 'Submit Assignment'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-light">
                            <h5 className="fw-bold text-dark mb-3">Submission Guidelines</h5>
                            <ul className="small text-secondary lh-lg mb-0 ps-3">
                                <li>Ensure your code adheres to clean modular principles.</li>
                                <li>Test all edge cases and practical implementations.</li>
                                <li>Include comments or documentation if relevant.</li>
                                <li>Submitting after the deadline will automatically flag the submission as late.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructor / Admin View: Review & Grade All Student Submissions */}
            {isInstructorOrAdmin && (
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mt-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                        <div>
                            <h4 className="fw-bold text-dark mb-0">Student Submissions &amp; Grading</h4>
                            <small className="text-secondary">Review submissions, evaluate work, assign marks, and provide constructive feedback.</small>
                        </div>
                        <span className="badge bg-primary px-3 py-2">
                            Total Submissions: {assignment.submissions?.length || 0}
                        </span>
                    </div>

                    {assignment.submissions && assignment.submissions.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Student</th>
                                        <th>Submitted At</th>
                                        <th>Status</th>
                                        <th>Solution Details</th>
                                        <th>Grade</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignment.submissions.map(sub => (
                                        <tr key={sub.id}>
                                            <td>
                                                <strong className="text-dark d-block">{sub.student_name}</strong>
                                                <small className="text-secondary">{sub.student_email}</small>
                                            </td>
                                            <td className="small text-muted">
                                                {new Date(sub.submitted_at).toLocaleString()}
                                            </td>
                                            <td>
                                                <span className={`badge ${sub.status === 'graded' ? 'bg-success' : sub.status === 'late' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td style={{ maxWidth: '300px' }}>
                                                <p className="small text-dark mb-1 text-truncate">{sub.submission_text}</p>
                                                {sub.file_url && (
                                                    <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="small text-primary text-decoration-none d-block">
                                                        🔗 {sub.file_url}
                                                    </a>
                                                )}
                                                {sub.feedback && (
                                                    <small className="text-muted d-block mt-1"><em>Feedback: {sub.feedback}</em></small>
                                                )}
                                            </td>
                                            <td>
                                                {sub.marks_obtained !== null ? (
                                                    <strong className="text-success fs-6">{sub.marks_obtained} / {assignment.max_marks}</strong>
                                                ) : (
                                                    <span className="text-muted small">Not graded</span>
                                                )}
                                            </td>
                                            <td>
                                                <button 
                                                    className="btn btn-outline-primary btn-sm fw-bold"
                                                    onClick={() => {
                                                        setGradingId(sub.id);
                                                        setMarksInput(sub.marks_obtained !== null ? sub.marks_obtained : '');
                                                        setFeedbackInput(sub.feedback || '');
                                                    }}
                                                >
                                                    {sub.status === 'graded' ? 'Edit Grade' : 'Grade & Feedback'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <span className="fs-1 d-block mb-2">📭</span>
                            <p className="mb-0">No students have submitted solutions for this assignment yet.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Grading Modal */}
            {gradingId && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <div className="modal-header bg-primary text-white border-0 py-3">
                                <h5 className="modal-title fw-bold">Evaluate Student Submission</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setGradingId(null)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Marks Obtained (out of {assignment.max_marks})</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        min="0" 
                                        max={assignment.max_marks}
                                        value={marksInput}
                                        onChange={(e) => setMarksInput(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Feedback to Student</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="4"
                                        placeholder="Add constructive comments, praise, or areas for improvement..."
                                        value={feedbackInput}
                                        onChange={(e) => setFeedbackInput(e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button type="button" className="btn btn-secondary" onClick={() => setGradingId(null)}>Cancel</button>
                                <button 
                                    type="button" 
                                    className="btn btn-success px-4 fw-bold"
                                    onClick={() => handleGradeSubmission(gradingId)}
                                    disabled={savingGrade}
                                >
                                    {savingGrade ? 'Saving...' : 'Submit Evaluation'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentDetails;
