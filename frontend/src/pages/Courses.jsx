import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCoursesList } from '../services/courseService';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    const [errorMessage, setErrorMessage] = useState(null);

    const loadCourses = async () => {
        setLoading(true);
        setErrorMessage(null);
        try {
            const data = await getCoursesList();
            setCourses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading courses catalog:", error);
            setErrorMessage("Could not load online catalog. Please verify your connection.");
            setCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status" style={{ width: '3rem', height: '3rem' }}></div>
                <h5 className="text-secondary">Loading academic courses &amp; module catalog...</h5>
            </div>
        );
    }

    // Defensive array guarantees
    const safeCourses = Array.isArray(courses) ? courses : [];

    // Extract unique categories safely
    const categories = ['all', ...new Set(safeCourses.map(c => c?.category).filter(Boolean))];

    // Filter courses safely
    const filteredCourses = safeCourses.filter(course => {
        if (!course) return false;
        const title = (course.title || '').toLowerCase();
        const desc = (course.short_description || '').toLowerCase();
        const instructor = (course.instructor || '').toLowerCase();
        const q = searchQuery.toLowerCase();

        const matchesSearch = !q || title.includes(q) || desc.includes(q) || instructor.includes(q);
        const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
        const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;

        return matchesSearch && matchesCategory && matchesDifficulty;
    });

    return (
        <div className="container py-5">
            {/* Header Banner */}
            <div className="p-4 p-md-5 mb-4 rounded-4 bg-white shadow-sm border d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                    <span className="badge bg-primary px-3 py-1 mb-2">Curriculum Catalog</span>
                    <h2 className="fw-bold text-dark mb-1">Explore Courses &amp; Modules</h2>
                    <p className="text-secondary mb-0">Master high-demand computing skills with sequenced modules (1.1, 1.2...), sample solutions, quizzes, and accredited certifications.</p>
                </div>
                <button 
                    onClick={loadCourses} 
                    className="btn btn-outline-primary btn-sm fw-bold px-3 py-2 shadow-sm"
                    title="Refresh courses from Supabase/Cloud"
                >
                    🔄 Refresh Catalog
                </button>
            </div>

            {errorMessage && (
                <div className="alert alert-warning alert-dismissible fade show shadow-sm" role="alert">
                    <strong>⚠️ Notice:</strong> {errorMessage}
                    <button type="button" className="btn-close" onClick={() => setErrorMessage(null)}></button>
                </div>
            )}

            {/* Filter & Search Bar Controls */}
            <div className="card border-0 shadow-sm p-4 mb-4 bg-white rounded-4">
                <div className="row g-3">
                    <div className="col-md-6 col-lg-5">
                        <label className="form-label small fw-bold text-secondary">Search Courses &amp; Modules</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0">🔍</span>
                            <input 
                                type="text" 
                                className="form-control border-start-0" 
                                placeholder="Search by title, topic, or instructor..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="col-md-3 col-lg-4">
                        <label className="form-label small fw-bold text-secondary">Category</label>
                        <select 
                            className="form-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Domains & Categories' : cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3 col-lg-3">
                        <label className="form-label small fw-bold text-secondary">Level</label>
                        <select 
                            className="form-select"
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                        >
                            <option value="all">All Difficulties</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Course Cards Grid */}
            <div className="row g-4">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map(course => (
                        <div key={course.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0 rounded-4 overflow-hidden d-flex flex-column bg-white">
                                <div className="position-relative">
                                    <img 
                                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'} 
                                        alt={course.title}
                                        className="w-100" 
                                        style={{ height: '180px', objectFit: 'cover' }} 
                                    />
                                    <span className="badge position-absolute top-0 end-0 m-3 bg-dark bg-opacity-75 text-white">
                                        ⚡ {course.difficulty}
                                    </span>
                                </div>

                                <div className="p-4 flex-grow-1 d-flex flex-column justify-content-between">
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="badge bg-primary-subtle text-primary">{course.category || 'Computer Science'}</span>
                                            <span className="badge bg-light text-secondary border">
                                                {course.total_modules || 4} Modules (1.1 - 1.{course.total_modules || 4})
                                            </span>
                                        </div>
                                        <h5 className="fw-bold text-dark mb-2">{course.title}</h5>
                                        <small className="text-muted d-block mb-2">Instructor: {course.instructor}</small>
                                        <p className="text-secondary small mb-3">{course.short_description}</p>
                                    </div>

                                    <div className="pt-3 border-top d-flex gap-2">
                                        <Link to={`/courses/${course.id}`} className="btn btn-outline-primary btn-sm flex-fill fw-bold">
                                            📋 Course Syllabus
                                        </Link>
                                        <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm flex-fill fw-bold shadow-sm">
                                            Enroll &amp; Start &rarr;
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <div className="card p-5 border-0 shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
                            <div className="fs-1 mb-2">📚</div>
                            <h5 className="fw-bold">No courses match your search criteria</h5>
                            <p className="text-secondary small">Try adjusting your keyword filter or select "All Domains &amp; Categories".</p>
                            <button 
                                className="btn btn-outline-primary btn-sm mx-auto fw-bold"
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedDifficulty('all'); }}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Courses;
