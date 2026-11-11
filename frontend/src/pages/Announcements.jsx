import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Announcements = () => {
    const { user } = useContext(AuthContext);

    const [announcements, setAnnouncements] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [priorityFilter, setPriorityFilter] = useState('all');

    // Create Announcement Modal/Form State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newPriority, setNewPriority] = useState('normal');
    const [newCourseId, setNewCourseId] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [annRes, courseRes] = await Promise.all([
                api.get('/announcements/list.php'),
                api.get('/courses/list.php')
            ]);
            setAnnouncements(annRes.data || []);
            setCourses(courseRes.data || []);
        } catch (err) {
            console.error("Failed to load announcements", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim()) {
            alert("Please fill in both title and announcement details.");
            return;
        }

        setCreating(true);
        try {
            await api.post('/announcements/create.php', {
                author_id: user?.id,
                title: newTitle,
                content: newContent,
                priority: newPriority,
                course_id: newCourseId ? parseInt(newCourseId) : null
            });
            setShowCreateModal(false);
            setNewTitle('');
            setNewContent('');
            setNewPriority('normal');
            setNewCourseId('');
            loadData();
        } catch (err) {
            alert("Failed to publish announcement. Please try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this announcement?")) return;
        try {
            await api.post('/announcements/delete.php', { id });
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            alert("Failed to delete announcement.");
        }
    };

    const filtered = priorityFilter === 'all' 
        ? announcements 
        : announcements.filter(a => a.priority === priorityFilter);

    const canPublish = user && (user.role === 'instructor' || user.role === 'admin');

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="p-4 rounded-4 bg-white shadow-sm mb-4 border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-primary px-3 py-1 mb-2">Campus &amp; Course Bulletins</span>
                    <h2 className="fw-bold text-dark mb-1">Announcements &amp; Notifications</h2>
                    <p className="text-secondary mb-0">Official updates from faculty members, university administrators, and instructors.</p>
                </div>
                {canPublish && (
                    <button 
                        className="btn btn-primary fw-bold shadow-sm px-4"
                        onClick={() => setShowCreateModal(true)}
                    >
                        ➕ Post Announcement
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div className="btn-group btn-group-sm" role="group">
                    <button 
                        className={`btn ${priorityFilter === 'all' ? 'btn-dark' : 'btn-outline-secondary'}`}
                        onClick={() => setPriorityFilter('all')}
                    >
                        All Updates ({announcements.length})
                    </button>
                    <button 
                        className={`btn ${priorityFilter === 'urgent' ? 'btn-danger' : 'btn-outline-danger'}`}
                        onClick={() => setPriorityFilter('urgent')}
                    >
                        🚨 Urgent
                    </button>
                    <button 
                        className={`btn ${priorityFilter === 'high' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                        onClick={() => setPriorityFilter('high')}
                    >
                        ⚠️ High Priority
                    </button>
                    <button 
                        className={`btn ${priorityFilter === 'normal' ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setPriorityFilter('normal')}
                    >
                        📌 General
                    </button>
                </div>
            </div>

            {/* Announcements List */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-secondary mt-2">Loading announcements...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                    {filtered.map(ann => {
                        const isUrgent = ann.priority === 'urgent';
                        const isHigh = ann.priority === 'high';

                        return (
                            <div 
                                className={`card border-0 shadow-sm rounded-4 p-4 bg-white ${
                                    isUrgent ? 'border-start border-danger border-5' : isHigh ? 'border-start border-warning border-5' : 'border-start border-primary border-5'
                                }`} 
                                key={ann.id}
                            >
                                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <span className={`badge ${
                                            isUrgent ? 'bg-danger' : isHigh ? 'bg-warning text-dark' : 'bg-primary'
                                        } text-uppercase px-3 py-1`}>
                                            {ann.priority}
                                        </span>
                                        {ann.course_title && (
                                            <span className="badge bg-light text-secondary border">
                                                Course: {ann.course_title}
                                            </span>
                                        )}
                                        <small className="text-muted">
                                            Posted by <strong>{ann.author_name}</strong> on {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : 'N/A'}
                                        </small>
                                    </div>

                                    {canPublish && (
                                        <button 
                                            className="btn btn-outline-danger btn-sm py-0 px-2"
                                            onClick={() => handleDelete(ann.id)}
                                            title="Delete announcement"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                <h5 className="fw-bold text-dark mb-2">{ann.title}</h5>
                                <p className="text-secondary mb-0 lh-base" style={{ whiteSpace: 'pre-line' }}>
                                    {ann.content}
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card p-5 border-0 shadow-sm text-center rounded-4 bg-white">
                    <div className="display-4 mb-2">📢</div>
                    <h5 className="fw-bold">No announcements found</h5>
                    <p className="text-secondary mb-0">Check back later for university and course updates.</p>
                </div>
            )}

            {/* Create Announcement Modal */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 rounded-4">
                            <form onSubmit={handleCreateAnnouncement}>
                                <div className="modal-header bg-primary text-white border-0 py-3">
                                    <h5 className="modal-title fw-bold">📢 Publish New Announcement</h5>
                                    <button 
                                        type="button" 
                                        className="btn-close btn-close-white" 
                                        onClick={() => setShowCreateModal(false)}
                                    ></button>
                                </div>
                                <div className="modal-body p-4">
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Announcement Title</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            placeholder="e.g. Midterm Project Guidelines or Holiday Schedule"
                                            value={newTitle}
                                            onChange={(e) => setNewTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Target Course</label>
                                            <select 
                                                className="form-select"
                                                value={newCourseId}
                                                onChange={(e) => setNewCourseId(e.target.value)}
                                            >
                                                <option value="">Campus-Wide (All Students)</option>
                                                {courses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small fw-bold">Priority Level</label>
                                            <select 
                                                className="form-select"
                                                value={newPriority}
                                                onChange={(e) => setNewPriority(e.target.value)}
                                            >
                                                <option value="normal">Normal Priority</option>
                                                <option value="high">High Priority</option>
                                                <option value="urgent">Urgent / Important</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label small fw-bold">Announcement Content</label>
                                        <textarea 
                                            className="form-control" 
                                            rows="5"
                                            placeholder="Write announcement details, deadlines, or instructions..."
                                            value={newContent}
                                            onChange={(e) => setNewContent(e.target.value)}
                                            required
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0">
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary px-4 fw-bold"
                                        disabled={creating}
                                    >
                                        {creating ? 'Publishing...' : 'Publish Announcement'}
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

export default Announcements;
