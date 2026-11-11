import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const BatchEnrollment = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [activeTab, setActiveTab] = useState('excel'); // 'excel' or 'manual'

    // File Upload State
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState([]);
    
    // Manual Textarea State
    const [manualText, setManualText] = useState('');

    const [loadingCourses, setLoadingCourses] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user || (user.role !== 'instructor' && user.role !== 'admin')) {
            alert('Access restricted to instructors and administrators.');
            navigate('/courses');
            return;
        }

        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/list.php');
                setCourses(response.data);
                if (response.data.length > 0) {
                    setSelectedCourseId(response.data[0].id);
                }
            } catch (err) {
                console.error("Failed to load courses", err);
                setError('Could not load course list.');
            } finally {
                setLoadingCourses(false);
            }
        };

        fetchCourses();
    }, [user, navigate]);

    // Handle File Selection
    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError('');

        // Preview text/csv contents if possible
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target.result;
            const lines = text.split('\n').filter(l => l.trim() !== '');
            const parsed = lines.slice(0, 6).map(line => line.split(',').map(c => c.trim()));
            setFilePreview(parsed);
        };
        reader.readAsText(selectedFile);
    };

    // Download Sample CSV/Excel Template
    const handleDownloadTemplate = () => {
        const sampleContent = "Student Name,Student Email,Course Name or ID\nEmily Clark,emily.clark@university.edu,Full Stack Web Development\nLiam Johnson,liam.johnson@university.edu,Python for Data Science\nSophia Davis,sophia.davis@university.edu,Modern React 19\nNoah Martinez,noah.martinez@university.edu,Database Systems & Advanced SQL\nAva Wilson,ava.wilson@university.edu,Full Stack Web Development";
        const blob = new Blob([sampleContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'learnsphere_students_batch_enrollment_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Handle Form Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!selectedCourseId) {
            setError('Please select a course to enroll students into.');
            return;
        }

        setProcessing(true);

        try {
            if (activeTab === 'excel') {
                if (!file) {
                    setError('Please select an Excel / CSV spreadsheet file to upload.');
                    setProcessing(false);
                    return;
                }

                const formData = new FormData();
                formData.append('course_id', selectedCourseId);
                formData.append('instructor_id', user.id);
                formData.append('file', file);

                const response = await api.post('/enrollments/batch-enroll.php', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setResult(response.data);
            } else {
                // Manual Textarea
                if (!manualText.trim()) {
                    setError('Please enter at least one student name and email.');
                    setProcessing(false);
                    return;
                }

                // Parse manual lines
                const lines = manualText.split('\n').filter(l => l.trim() !== '');
                const students = lines.map(line => {
                    const parts = line.split(',');
                    if (parts.length >= 2) {
                        return { name: parts[0].trim(), email: parts[1].trim() };
                    }
                    return { name: line.trim().split('@')[0], email: line.trim() };
                });

                const response = await api.post('/enrollments/batch-enroll.php', {
                    course_id: selectedCourseId,
                    instructor_id: user.id,
                    students: students
                });

                setResult(response.data);
            }
        } catch (err) {
            console.error("Batch enrollment error", err);
            setError(err.response?.data?.message || 'Failed to process batch enrollment. Please check the format.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div>
                    <Link to="/instructor" className="text-decoration-none text-secondary small">
                        &larr; Back to Instructor Portal
                    </Link>
                    <h2 className="fw-bold text-dark mt-1 mb-0">👥 Automated Excel Batch Enrollment</h2>
                    <p className="text-secondary small mb-0">
                        Upload your full Excel/CSV class sheet. The system auto-provisions accounts and assigns students to courses automatically!
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <Link to="/instructor/issue-course" className="btn btn-warning text-dark btn-sm fw-bold shadow-sm">
                        🎓 Issue Course to Student &rarr;
                    </Link>
                    <Link to={`/instructor/course-students/${selectedCourseId || ''}`} className="btn btn-outline-primary btn-sm">
                        View Enrolled Students &rarr;
                    </Link>
                </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="row g-4">
                {/* Left Column: Enrollment Form */}
                <div className="col-lg-7">
                    <div className="card border-0 shadow-sm p-4 bg-white rounded-4">
                        <form onSubmit={handleSubmit}>
                            {/* Course Selection */}
                            <div className="mb-4">
                                <label className="form-label fw-bold text-dark">
                                    1. Select Target Course
                                </label>
                                {loadingCourses ? (
                                    <div className="spinner-border spinner-border-sm text-primary"></div>
                                ) : (
                                    <select 
                                        className="form-select form-select-lg"
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                        required
                                    >
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.title} ({c.category})
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <small className="text-muted d-block mt-1">
                                    Students added in this batch will be instantly registered and enrolled into this course.
                                </small>
                            </div>

                            {/* Method Tabs */}
                            <div className="mb-3">
                                <label className="form-label fw-bold text-dark">
                                    2. Choose Import Method
                                </label>
                                <ul className="nav nav-pills nav-fill mb-3">
                                    <li className="nav-item">
                                        <button 
                                            type="button" 
                                            className={`nav-link fw-bold ${activeTab === 'excel' ? 'active' : 'bg-light text-secondary'}`}
                                            onClick={() => setActiveTab('excel')}
                                        >
                                            📊 Upload Excel / CSV Spreadsheet
                                        </button>
                                    </li>
                                    <li className="nav-item ms-2">
                                        <button 
                                            type="button" 
                                            className={`nav-link fw-bold ${activeTab === 'manual' ? 'active' : 'bg-light text-secondary'}`}
                                            onClick={() => setActiveTab('manual')}
                                        >
                                            ✍️ Paste Student Email List
                                        </button>
                                    </li>
                                </ul>
                            </div>

                            {/* TAB 1: EXCEL / CSV UPLOAD */}
                            {activeTab === 'excel' && (
                                <div className="p-4 border rounded-3 bg-light mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0 text-dark">Spreadsheet File (.csv, .xls, .xlsx)</h6>
                                        <button 
                                            type="button" 
                                            className="btn btn-outline-success btn-sm fw-semibold"
                                            onClick={handleDownloadTemplate}
                                        >
                                            📥 Download Sample CSV Template
                                        </button>
                                    </div>

                                    <div className="mb-3">
                                        <input 
                                            type="file" 
                                            className="form-control form-control-lg" 
                                            accept=".csv, .txt, .xls, .xlsx"
                                            onChange={handleFileChange}
                                        />
                                        <div className="p-2 bg-white rounded border mt-2 small text-secondary">
                                            <strong>📑 Excel Sheet Format:</strong><br />
                                            • <strong>Col 1:</strong> Student Name (e.g. <code>Ayesha Khan</code>)<br />
                                            • <strong>Col 2:</strong> Student Email (e.g. <code>ayesha@university.edu</code>)<br />
                                            • <strong>Col 3:</strong> Course Name or ID (Optional: e.g. <code>Full Stack Web Development</code> or <code>1</code>. If omitted, uses Target Course above).
                                        </div>
                                    </div>

                                    {/* Quick Preview of uploaded file */}
                                    {filePreview.length > 0 && (
                                        <div className="mt-3">
                                            <small className="fw-bold text-secondary d-block mb-1">
                                                File Preview (First {filePreview.length} lines detected):
                                            </small>
                                            <div className="table-responsive bg-white rounded border">
                                                <table className="table table-sm table-striped mb-0 small">
                                                    <thead>
                                                        <tr>
                                                            <th>Col 1 (Student Name)</th>
                                                            <th>Col 2 (Student Email)</th>
                                                            <th>Col 3 (Assigned Course / Auto)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filePreview.map((row, idx) => (
                                                            <tr key={idx}>
                                                                <td><strong>{row[0] || '—'}</strong></td>
                                                                <td>{row[1] || '—'}</td>
                                                                <td>
                                                                    <span className="badge bg-primary-subtle text-primary">
                                                                        {row[2] || 'Default Selected Course'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 2: MANUAL TEXTAREA */}
                            {activeTab === 'manual' && (
                                <div className="p-4 border rounded-3 bg-light mb-4">
                                    <h6 className="fw-bold text-dark mb-2">Paste Student Entries</h6>
                                    <p className="small text-secondary mb-2">
                                        Enter one student per line in the format: <code>Student Name, student.email@university.edu</code>
                                    </p>
                                    <textarea 
                                        className="form-control font-monospace" 
                                        rows="7"
                                        placeholder={`Emily Clark, emily.clark@university.edu\nLiam Johnson, liam.johnson@university.edu\nSophia Davis, sophia.davis@university.edu`}
                                        value={manualText}
                                        onChange={(e) => setManualText(e.target.value)}
                                    ></textarea>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                className="btn btn-primary btn-lg w-100 fw-bold shadow-sm"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Processing Batch Enrollment...
                                    </>
                                ) : (
                                    '🚀 Enroll Batch of Students Now'
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Column: Instructions & Live Batch Report */}
                <div className="col-lg-5">
                    {/* Live Results Card */}
                    {result ? (
                        <div className="card border-0 shadow-sm p-4 bg-white rounded-4 mb-4 border-top border-success border-4">
                            <span className="badge bg-success-subtle text-success fs-6 mb-2 align-self-start">
                                ✓ Batch Processed Successfully
                            </span>
                            <h4 className="fw-bold text-dark mb-1">{result.course_title}</h4>
                            <p className="text-secondary small mb-3">All student accounts and enrollments are synchronized.</p>

                            <div className="row g-2 text-center mb-3">
                                <div className="col-4">
                                    <div className="p-2 border rounded bg-light">
                                        <small className="text-secondary d-block">Processed</small>
                                        <h5 className="fw-bold text-primary mb-0">{result.total_records}</h5>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-2 border rounded bg-light">
                                        <small className="text-secondary d-block">New Accounts</small>
                                        <h5 className="fw-bold text-success mb-0">+{result.newly_created_accounts}</h5>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-2 border rounded bg-light">
                                        <small className="text-secondary d-block">Enrolled</small>
                                        <h5 className="fw-bold text-info mb-0">{result.newly_enrolled}</h5>
                                    </div>
                                </div>
                            </div>

                            <h6 className="fw-bold text-dark mb-2 small">Imported Student Roster:</h6>
                            <div className="border rounded bg-light p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                <ul className="list-group list-group-flush small">
                                    {result.students.map((st, i) => (
                                        <li key={i} className="list-group-item d-flex justify-content-between align-items-center bg-transparent px-2 py-2 border-bottom">
                                            <div>
                                                <strong className="text-dark d-block">{st.name}</strong>
                                                <small className="text-muted d-block">{st.email}</small>
                                                {st.course && (
                                                    <span className="badge bg-light text-dark border mt-1">
                                                        📖 Course: {st.course}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`badge ${st.status.includes('Successfully') ? 'bg-success' : 'bg-secondary'}`}>
                                                {st.status}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-3">
                                <Link to={`/instructor/course-students/${selectedCourseId}`} className="btn btn-success btn-sm w-100 fw-bold">
                                    View Full Class Roster &rarr;
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="card border-0 shadow-sm p-4 bg-white rounded-4 mb-4">
                            <h5 className="fw-bold text-dark mb-3">💡 How Automatic Batch Import Works</h5>
                            <ul className="text-secondary small ps-3 mb-4 lh-lg">
                                <li>
                                    <strong>Smart Account Creation:</strong> If a student does not already have an account, LearnSphere automatically creates their student account with default credentials (<code>Student@123</code>).
                                </li>
                                <li>
                                    <strong>No Duplicate Enrollments:</strong> If a student is already enrolled in the selected course, their progress is preserved and duplicates are safely skipped.
                                </li>
                                <li>
                                    <strong>Supported Formats:</strong> Upload standard Excel CSV, semicolon-separated CSV, or paste lines directly into the text area.
                                </li>
                                <li>
                                    <strong>Instant Access:</strong> Enrolled students will immediately see the course on their <strong>"My Learning"</strong> dashboard upon login.
                                </li>
                            </ul>

                            <div className="p-3 bg-light rounded-3 border">
                                <strong className="text-primary small d-block mb-1">Expected CSV Column Structure:</strong>
                                <pre className="bg-white p-2 border rounded font-monospace small mb-0">
Name,Email{"\n"}
John Smith,john.smith@university.edu{"\n"}
Alice Wong,alice.wong@university.edu
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BatchEnrollment;
