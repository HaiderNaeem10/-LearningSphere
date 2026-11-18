import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * ProtectedRoute component guards routes based on authentication and optional role.
 * Usage: <ProtectedRoute requiredRole="student" /> will render child routes via <Outlet />
 *        if the user is logged in and has the required role. Otherwise redirects to /login.
 */
const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    // Optionally render a spinner
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(user.role)) {
      // Optionally could show 403 page; redirect to home for now
      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
