import React, { useEffect, useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const ProtectedRoute = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useContext(UserContext);
  
  // Get the token from localStorage as a fallback
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  
  // If no token or user data, redirect to login
  if (!token || !userData) {
    const redirectUrl = `${location.pathname}${location.search}`;
    console.log('No token or user data found, redirecting to login. Will redirect back to:', redirectUrl);
    return <Navigate to={`/login?from=${encodeURIComponent(redirectUrl)}`} replace />;
  }
  
  // If we have a token but the context isn't updated yet, try to initialize it
  if (token && !isAuthenticated) {
    try {
      const parsedUser = JSON.parse(userData);
      // Update the user context with the stored data
      if (parsedUser && parsedUser._id) {
        // The context update will trigger a re-render
        return <div>Loading...</div>; // Show loading state while context updates
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }
  }

  // If authenticated, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
