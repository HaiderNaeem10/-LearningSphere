import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Resources = () => {
    const { user } = useContext(AuthContext);

    const [resources, setResources] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    // Create resource modal state
    const [showModal, setShowModal] = useState(false);
    const [courseId, setCourseId] = useState('');
    const [title, setTitle] = useState('');
    const [resourceType, setResourceType] = useState('pdf');
    const [resourceUrl, setResourceUrl] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [resData, courseData] = await Promise.all([
                api.get('/resources/list.php'),
                api.get('/courses/list.php')
            ]);
            setResources(resData.data || []);
            setCourses(courseData.data || []);
            if (courseData.data && courseData.data.length > 0) {
                setCourseId(courseData.data[0].id);
            }
        } catch (err) {
            console.error("Failed to load resources", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateResource = async (e) => {
        e.preventDefault();
        if (!title.trim() || !resourceUrl.trim() || !courseId) {
            alert("Please provide resource title, course, and URL.");
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/resources/create.php', {
                course_id: parseInt(courseId),
                title,
                resource_type: resourceType,
                resource_url: resourceUrl,
                description
            });
            setShowModal(false);
            setTitle('');
            setResourceUrl('');
            setDescription('');
            loadData();
        } catch (err) {
            alert("Failed to upload resource.");
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = resources.filter(r => {
        const matchesCourse = selectedCourse === 'all' || parseInt(r.course_id) === parseInt(selectedCourse);
        const matchesType = selectedType === 'all' || r.resource_type === selectedType;
        return matchesCourse && matchesType;
    });

    const canUpload = user && (user.role === 'instructor' || user.role === 'admin');

    const getTypeIcon = (type) => {
        switch (type) {
            case 'pdf': return '📄';
            case 'code': return '💻';
            case 'slides': return '📊';
            case 'cheatsheet': return '📑';
            case 'link': return '🔗';
            default: return '📦';
        }
    };

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="p-4 rounded-4 bg-white shadow-sm mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-info px-3 py-1 mb-2 text-dark">Course Hub</span>
                    <h2 className="fw-bold text-dark mb-1">Learning Resources &amp; Material Repository</h2>
                    <p className="text-secondary mb-0">Download lecture slides, sample code repositories, reference cheat sheets, and project guides.</p>
                </div>
                {canUpload && (
                    <button 
                        className="btn btn-primary fw-bold shadow-sm px-4"
                        onClick={() => setShowModal(true)}
                    >
                        ➕ Upload Resource
                    </button>
                )}
            </div>

            {/* Filter Controls */}
            <div className="card border-0 shadow-sm p-3 mb-4 bg-white rounded-3">
                <div className="row g-3 align-items-center">
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Filter by Course</label>
                        <select 
                            className="form-select form-select-sm"
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                        >
                            <option value="all">All Registered Courses ({resources.length})</option>
                            {courses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label small fw-bold text-secondary mb-1">Filter by Resource Format</label>
                        <select 
                            className="form-select form-select-sm"
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="all">All Formats (PDF, Code, Slides, Links)</option>
                            <option value="pdf">PDF Documents</option>
                            <option value="code">Source Code &amp; Repositories</option>
                            <option value="slides">Presentation Slides</option>
                            <option value="cheatsheet">Cheat Sheets</option>
                            <option value="link">External Reference Links</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Resources Grid */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-secondary mt-2">Loading repository files...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="row g-3">
                    {filtered.map(item => (
                        <div className="col-md-6 col-lg-4" key={item.id}>
                            <div className="card h-100 border-0 shadow-sm p-4 bg-white rounded-4 d-flex flex-column justify-content-between">
                                <div>
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <span className="fs-3">{getTypeIcon(item.resource_type)}</span>
                                        <span className="badge bg-secondary-subtle text-secondary text-uppercase small">
                                            {item.resource_type}
                                        </span>
                                    </div>
                                    <h5 className="fw-bold text-dark mb-1">{item.title}</h5>
                                    <small className="text-primary fw-semibold d-block mb-2">Course: {item.course_title}</small>
                                    <p className="text-muted small mb-3">{item.description || 'No description provided.'}</p>
                                </div>

                                <div>
                                    <a 
                                        href={item.resource_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn btn-outline-primary btn-sm w-100 fw-bold"
                                    >
                                        📥 Open / Download Resource
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card p-5 border-0 shadow-sm text-center rounded-4 bg-white">
                    <div className="display-4 mb-2">📂</div>
                    <h5 className="fw-bold">No resources match your filter</h5>
                    <p className="text-secondary mb-0">Try selecting a different course or format filter.</p>
                </div>
            )}

            {/* Upload Modal */}
            {showModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <form onSubmit={handleCreateResource}>
                                <div className="modal-header bg-primary text-white border-0 py-3">
                                    <h5 className="modal-title fw-bold">📦 Upload Course Resource</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setShowModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Target Course</label>
                                        <select 
                                            className="form-select"
                                            value={courseId}
                                            onChange={(e) => setCourseId(e.target.value)}
                                            required
                                        >
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Resource Title</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Modern CSS Flexbox & Grid Cheatsheet"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Resource Type</label>
                                            <select 
                                                className="form-select"
                                                value={resourceType}
                                                onChange={(e) => setResourceType(e.target.value)}
                                            >
                                                <option value="pdf">PDF Document</option>
                                                <option value="code">Code Repository</option>
                                                <option value="slides">Slides / Presentation</option>
                                                <option value="cheatsheet">Cheat Sheet</option>
                                                <option value="link">Web Link</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Resource URL / Direct Link</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                placeholder="https://..."
                                                value={resourceUrl}
                                                onChange={(e) => setResourceUrl(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Description (Optional)</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="3"
                                            placeholder="Briefly explain what students can learn from this file..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary px-4 fw-bold"
                                        disabled={submitting}
                                    >
                                        {submitting ? 'Saving...' : 'Add Resource'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Resources;
