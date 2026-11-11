import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import AdminAddUser from './AdminAddUser';

const AdminDashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentCourses, setRecentCourses] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [allCourses, setAllCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'courses', 'categories'
    const [userRoleFilter, setUserRoleFilter] = useState('all');
    const [userSearch, setUserSearch] = useState('');

    // Category modal state
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
            return;
        }

        loadAdminData();
    }, [user, navigate]);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const [statsRes, usersRes, coursesRes, catRes] = await Promise.all([
                api.get('/admin/stats.php'),
                api.get('/admin/users.php'),
                api.get('/admin/courses.php'),
                api.get('/admin/categories.php')
            ]);
            setStats(statsRes.data.stats);
            setRecentUsers(statsRes.data.recent_users || []);
            setRecentCourses(statsRes.data.recent_courses || []);
            setAllUsers(usersRes.data || []);
            setAllCourses(coursesRes.data || []);
            setCategories(catRes.data || []);
        } catch (err) {
            console.error("Failed to load admin stats", err);
        } finally {
            setLoading(false);
        }
    };

    // User Approval Toggle
    const handleToggleApproval = async (userId, currentStatus) => {
        const nextStatus = currentStatus ? 0 : 1;
        try {
            await api.post('/admin/users.php', {
                action: 'toggle_approval',
                user_id: userId,
                is_approved: nextStatus
            });
            loadAdminData();
        } catch (err) {
            alert("Failed to update user approval status.");
        }
    };

    // Role Change
    const handleChangeRole = async (userId, newRole) => {
        try {
            await api.post('/admin/users.php', {
                action: 'change_role',
                user_id: userId,
                role: newRole
            });
            loadAdminData();
        } catch (err) {
            alert("Failed to change user role.");
        }
    };

    // Delete User
    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to permanently delete user "${userName}"?`)) return;
        try {
            await api.post('/admin/users.php', {
                action: 'delete_user',
                user_id: userId
            });
            loadAdminData();
        } catch (err) {
            alert("Failed to delete user.");
        }
    };

    // Course Status Toggle
    const handleToggleCourseStatus = async (courseId, currentStatus) => {
        const newStatus = currentStatus === 'published' ? 'draft' : 'published';
        try {
            await api.post('/admin/courses.php', {
                action: 'update_status',
                course_id: courseId,
                status: newStatus
            });
            loadAdminData();
        } catch (err) {
            alert("Failed to update course status.");
        }
    };

    // Delete Course
    const handleDeleteCourse = async (courseId, courseTitle) => {
        if (!window.confirm(`Are you sure you want to permanently delete course "${courseTitle}"?`)) return;
        try {
            await api.post('/admin/courses.php', {
                action: 'delete_course',
                course_id: courseId
            });
            loadAdminData();
        } catch (err) {
            alert("Failed to delete course.");
        }
    };

    // Add Category
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await api.post('/admin/categories.php', {
                name: newCatName,
                description: newCatDesc
            });
            setNewCatName('');
            setNewCatDesc('');
            loadAdminData();
        } catch (err) {
            alert("Failed to add category.");
        }
    };

    if (loading) {
        return (
            <div className="container py-5 text-center">
                <div className="spinner-border text-primary my-5" role="status"></div>
                <h5 className="text-secondary">Loading administrator console...</h5>
            </div>
        );
    }

    const filteredUsers = allUsers.filter(u => {
        const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
        const matchesSearch = !userSearch || 
            u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
            u.email.toLowerCase().includes(userSearch.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <div className="container py-4">
            {/* Header Banner */}
            <div className="p-4 p-md-5 rounded-4 text-white bg-dark shadow-sm mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3"
                 style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)' }}>
                <div>
                    <span className="badge bg-warning text-dark px-3 py-1 mb-2 fw-bold">⚙️ Platform Super-Admin</span>
                    <h2 className="fw-bold mb-1">Administrative Operations Hub</h2>
                    <p className="text-light opacity-75 mb-0">Control student accounts, instructor credentials, course approvals, and platform governance.</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <button 
                        className="btn btn-warning text-dark fw-bold px-3 shadow-sm d-flex align-items-center"
                        onClick={() => setActiveTab('add-user')}
                    >
                        <span className="me-1">👤➕</span> Add Member (Student/Teacher)
                    </button>
                    <Link to="/announcements" className="btn btn-outline-light fw-bold px-3">
                        📢 Broadcast Update
                    </Link>
                    <Link to="/courses" className="btn btn-outline-light fw-bold px-3">
                        Browse Courses
                    </Link>
                </div>
            </div>

            {/* Platform Metrics Overview Cards */}
            {stats && (
                <div className="row g-3 mb-4">
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-start border-primary border-4">
                            <small className="text-secondary">Total Users</small>
                            <h3 className="fw-bold text-primary mb-0">{stats.total_users}</h3>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-start border-success border-4">
                            <small className="text-secondary">Students</small>
                            <h3 className="fw-bold text-success mb-0">{stats.total_students}</h3>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-start border-warning border-4">
                            <small className="text-secondary">Instructors</small>
                            <h3 className="fw-bold text-warning mb-0">{stats.total_instructors}</h3>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-start border-info border-4">
                            <small className="text-secondary">Courses</small>
                            <h3 className="fw-bold text-info mb-0">{stats.total_courses}</h3>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-start border-danger border-4">
                            <small className="text-secondary">Enrollments</small>
                            <h3 className="fw-bold text-danger mb-0">{stats.total_enrollments}</h3>
                        </div>
                    </div>
                    <div className="col-lg-2 col-md-4 col-6">
                        <div className="card p-3 border-0 shadow-sm bg-white rounded-3 text-center border-start border-success border-4">
                            <small className="text-secondary">Certificates</small>
                            <h3 className="fw-bold text-success mb-0">{stats.total_certificates}</h3>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <ul className="nav nav-pills mb-4 gap-2 flex-wrap">
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'overview' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        📊 Overview
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'add-user' ? 'active bg-warning text-dark' : 'bg-white text-secondary shadow-sm'}`}
                        onClick={() => setActiveTab('add-user')}
                    >
                        👤➕ Add Member (Signup)
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'users' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                        onClick={() => setActiveTab('users')}
                    >
                        👥 User Management ({allUsers.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'courses' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                        onClick={() => setActiveTab('courses')}
                    >
                        📚 Course Moderation ({allCourses.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link px-4 fw-bold rounded-pill ${activeTab === 'categories' ? 'active bg-primary' : 'bg-white text-secondary shadow-sm'}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        📂 Categories ({categories.length})
                    </button>
                </li>
            </ul>

            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="row g-4">
                    {/* Recent Registrations */}
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold text-dark mb-0">Recent User Registrations</h5>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTab('users')}>View All</button>
                            </div>
                            <div className="list-group list-group-flush">
                                {recentUsers.map(u => (
                                    <div className="list-group-item px-0 d-flex justify-content-between align-items-center" key={u.id}>
                                        <div>
                                            <strong className="text-dark d-block">{u.name}</strong>
                                            <small className="text-secondary">{u.email}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className={`badge ${u.role === 'admin' ? 'bg-danger' : u.role === 'instructor' ? 'bg-warning text-dark' : 'bg-primary'} text-capitalize me-2`}>
                                                {u.role}
                                            </span>
                                            <span className={`badge ${u.is_approved ? 'bg-success' : 'bg-secondary'}`}>
                                                {u.is_approved ? 'Approved' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Recent Courses */}
                    <div className="col-lg-6">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="fw-bold text-dark mb-0">Recent Course Offerings</h5>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => setActiveTab('courses')}>View All</button>
                            </div>
                            <div className="list-group list-group-flush">
                                {recentCourses.map(c => (
                                    <div className="list-group-item px-0 d-flex justify-content-between align-items-center" key={c.id}>
                                        <div>
                                            <strong className="text-dark d-block">{c.title}</strong>
                                            <small className="text-secondary">Instructor: {c.instructor_name} • {c.category_name}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className={`badge ${c.status === 'published' ? 'bg-success' : 'bg-warning text-dark'} text-capitalize me-2`}>
                                                {c.status}
                                            </span>
                                            <span className="badge bg-light text-dark border">
                                                {c.enrollment_count} Students
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ADD NEW MEMBER */}
            {activeTab === 'add-user' && (
                <div className="mb-4">
                    <AdminAddUser 
                        isEmbedded={true} 
                        onUserAdded={(newUser) => {
                            loadAdminData();
                        }} 
                    />
                </div>
            )}

            {/* TAB 2: USER MANAGEMENT */}
            {activeTab === 'users' && (
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                        <div>
                            <h4 className="fw-bold text-dark mb-0">All System Users</h4>
                            <small className="text-muted">Manage roles, grant student or teacher access, approve or suspend accounts.</small>
                        </div>
                        <div className="d-flex gap-2 align-items-center flex-wrap">
                            <button 
                                className="btn btn-warning text-dark btn-sm fw-bold px-3 d-flex align-items-center shadow-sm"
                                onClick={() => setActiveTab('add-user')}
                            >
                                <span className="me-1">👤➕</span> Add New Member
                            </button>
                            <select 
                                className="form-select form-select-sm"
                                value={userRoleFilter}
                                onChange={(e) => setUserRoleFilter(e.target.value)}
                            >
                                <option value="all">All Roles</option>
                                <option value="student">Students</option>
                                <option value="instructor">Instructors</option>
                                <option value="admin">Admins</option>
                            </select>
                            <input 
                                type="text" 
                                className="form-control form-control-sm"
                                placeholder="Search by name or email..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Activity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <strong className="text-dark d-block">{u.name}</strong>
                                            <small className="text-secondary">{u.email}</small>
                                        </td>
                                        <td>
                                            <select 
                                                className="form-select form-select-sm w-auto"
                                                value={u.role}
                                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                            >
                                                <option value="student">Student</option>
                                                <option value="instructor">Instructor</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.is_approved ? 'bg-success' : 'bg-warning text-dark'}`}>
                                                {u.is_approved ? 'Approved' : 'Pending / Suspended'}
                                            </span>
                                        </td>
                                        <td className="small text-muted">
                                            {u.role === 'student' && `${u.enrolled_count || 0} Enrolled • ${u.certificates_count || 0} Certs`}
                                            {u.role === 'instructor' && `${u.authored_courses || 0} Courses authored`}
                                            {u.role === 'admin' && `System Administrator`}
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className={`btn btn-sm ${u.is_approved ? 'btn-outline-warning' : 'btn-success'}`}
                                                    onClick={() => handleToggleApproval(u.id, u.is_approved)}
                                                >
                                                    {u.is_approved ? 'Suspend' : 'Approve'}
                                                </button>
                                                {u.id !== user.id && (
                                                    <button 
                                                        className="btn btn-outline-danger btn-sm"
                                                        onClick={() => handleDeleteUser(u.id, u.name)}
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 3: COURSE MODERATION */}
            {activeTab === 'courses' && (
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                    <h4 className="fw-bold text-dark mb-3">Course Catalog Moderation</h4>
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Course</th>
                                    <th>Instructor</th>
                                    <th>Category</th>
                                    <th>Status</th>
                                    <th>Students</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allCourses.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <strong className="text-dark d-block">{c.title}</strong>
                                            <small className="badge bg-light text-secondary border text-capitalize">{c.difficulty}</small>
                                        </td>
                                        <td className="small">{c.instructor_name}</td>
                                        <td className="small">{c.category_name}</td>
                                        <td>
                                            <span className={`badge ${c.status === 'published' ? 'bg-success' : 'bg-warning text-dark'} text-capitalize`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge bg-primary">{c.enrollment_count}</span>
                                        </td>
                                        <td>
                                            <div className="d-flex gap-2">
                                                <button 
                                                    className={`btn btn-sm ${c.status === 'published' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                    onClick={() => handleToggleCourseStatus(c.id, c.status)}
                                                >
                                                    {c.status === 'published' ? 'Set to Draft' : 'Publish'}
                                                </button>
                                                <button 
                                                    className="btn btn-outline-danger btn-sm"
                                                    onClick={() => handleDeleteCourse(c.id, c.title)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 4: CATEGORY MANAGEMENT */}
            {activeTab === 'categories' && (
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <h5 className="fw-bold text-dark mb-3">Add New Category</h5>
                            <form onSubmit={handleAddCategory}>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Category Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        placeholder="e.g. Cloud Computing" 
                                        value={newCatName}
                                        onChange={(e) => setNewCatName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label small fw-bold">Description</label>
                                    <textarea 
                                        className="form-control" 
                                        rows="3" 
                                        placeholder="Brief domain overview..."
                                        value={newCatDesc}
                                        onChange={(e) => setNewCatDesc(e.target.value)}
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary fw-bold px-4">
                                    Save Category
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                            <h5 className="fw-bold text-dark mb-3">Existing Categories</h5>
                            <div className="list-group">
                                {categories.map(cat => (
                                    <div className="list-group-item d-flex justify-content-between align-items-center py-3" key={cat.id}>
                                        <div>
                                            <strong className="text-dark d-block">{cat.name}</strong>
                                            <small className="text-secondary">{cat.description || 'No description'}</small>
                                        </div>
                                        <span className="badge bg-secondary-subtle text-secondary">
                                            {cat.course_count || 0} Courses
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
