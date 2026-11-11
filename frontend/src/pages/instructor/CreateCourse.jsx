import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const CreateCourse = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [fullDesc, setFullDesc] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role !== 'instructor' && user?.role !== 'admin') {
            navigate('/courses');
        }

        // Fetch categories (assume an API endpoint exists)
        // For now, we will mock or you can implement the API later
        setCategories([
            { id: 1, name: 'Web Development' },
            { id: 2, name: 'Data Science' },
            { id: 3, name: 'Mobile Development' },
            { id: 4, name: 'Cyber Security' },
            { id: 5, name: 'Database Design' }
        ]);
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await api.post('/courses/create.php', {
                title,
                short_description: shortDesc,
                full_description: fullDesc,
                category_id: categoryId,
                instructor_id: user.id,
                difficulty
            });
            alert('Course created successfully!');
            navigate('/instructor');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create course');
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="card shadow-sm border-0">
                <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">Create New Course</h3>
                </div>
                <div className="card-body p-4">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Course Title</label>
                            <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Short Description</label>
                            <input type="text" className="form-control" value={shortDesc} onChange={e => setShortDesc(e.target.value)} required maxLength="200" />
                        </div>
                        <div className="mb-3">
                            <label className="form-label fw-bold">Full Description</label>
                            <textarea className="form-control" rows="5" value={fullDesc} onChange={e => setFullDesc(e.target.value)} required></textarea>
                        </div>
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Category</label>
                                <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Difficulty</label>
                                <select className="form-select" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                        <div className="d-flex justify-content-end">
                            <button type="submit" className="btn btn-success btn-lg px-5">Publish Course</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateCourse;
