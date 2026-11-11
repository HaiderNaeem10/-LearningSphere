import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Courses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/courses/list.php');
                setCourses(response.data || []);
            } catch (error) {
                console.error("Error fetching courses", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading academic courses...</h5>
            </div>
        );
    }

    // Extract unique categories
    const categories = ['all', ...new Set(courses.map(c => c.category).filter(Boolean))];

    // Filter courses
    const filteredCourses = courses.filter(course => {
        const matchesSearch = !searchQuery || 
            course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.instructor?.toLowerCase().includes(searchQuery.toLowerCase());
        
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
                    <h2 className="fw-bold text-dark mb-1">Explore Courses &amp; Specializations</h2>
                    <p className="text-secondary mb-0">Master high-demand tech and computing skills with interactive lessons and certifications.</p>
                </div>
            </div>

            {/* Filter & Search Bar Controls */}
            <div className="card border-0 shadow-sm p-4 mb-4 bg-white rounded-4">
                <div className="row g-3">
                    <div className="col-md-6 col-lg-5">
                        <label className="form-label small fw-bold text-secondary">Search Courses</label>
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
                                        <span className="badge bg-primary-subtle text-primary mb-2">{course.category || 'Computer Science'}</span>
                                        <h5 className="fw-bold text-dark mb-2">{course.title}</h5>
                                        <small className="text-muted d-block mb-2">Instructor: {course.instructor}</small>
                                        <p className="text-secondary small mb-3">{course.short_description}</p>
                                    </div>

                                    <div className="pt-3 border-top d-flex gap-2">
                                        <Link to={`/courses/${course.id}`} className="btn btn-outline-primary btn-sm flex-fill fw-bold">
                                            📋 Course Outline
                                        </Link>
                                        <Link to={`/courses/${course.id}`} className="btn btn-primary btn-sm flex-fill fw-bold shadow-sm">
                                            Enroll Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-12 text-center py-5">
                        <div className="card p-5 border-0 shadow-sm rounded-4 bg-white mx-auto" style={{ maxWidth: '500px' }}>
                            <div className="display-4 mb-2">🔍</div>
                            <h4 className="fw-bold">No Matching Courses</h4>
                            <p className="text-secondary mb-3">No courses match your active search filters. Try clearing search criteria.</p>
                            <button 
                                className="btn btn-outline-primary fw-bold"
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
