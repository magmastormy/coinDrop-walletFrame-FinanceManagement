import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import PropTypes from 'prop-types';
import AdminLayout from './AdminLayout';
import LoadingSpinner from '../../assets/loadingSpinner';

const AdminProtectedRoute = ({ children, title }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const location = useLocation();

  if (!isLoaded) return <LoadingSpinner />;

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin role is stored in Clerk publicMetadata as { role: 'admin' }
  if (user?.publicMetadata?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminLayout title={title}>{children}</AdminLayout>;
};

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired
};

export default AdminProtectedRoute;
