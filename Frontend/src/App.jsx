import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { UserContext } from './context/UserContext';

// Components
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Home/Dashboard";
import InterviewPrep from "./pages/InterviewPrep/InterviewPrep";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import UserProvider from './context/userContext';
import ProtectedRoute from './components/ProtectedRoute';

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100%',
    backgroundColor: '#f8f9fa',
  }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

// Component to handle redirects after login
const AuthCallback = () => {
  const location = useLocation();
  const { isAuthenticated } = useContext(UserContext);
  
  useEffect(() => {
    // This will run after the user is authenticated and the component mounts
  }, [isAuthenticated]);
  
  if (isAuthenticated) {
    // If we're authenticated, redirect to the dashboard or the originally requested page
    const searchParams = new URLSearchParams(location.search);
    const fromPath = searchParams.get('from') || '/dashboard';
    return <Navigate to={fromPath} replace />;
  }
  
  return <LoadingSpinner />;
};

const AppContent = () => {
  const { loading } = useContext(UserContext);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Routes>
      {/* Default Route */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/interview-prep/:sessionId" element={<InterviewPrep />} />
      </Route>
      
      {/* Catch all other routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <UserProvider>
      <div className="app-container">
        <Router>
          <AppContent />
        </Router>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              fontSize: '14px',
              maxWidth: '500px',
              padding: '10px 15px',
              backgroundColor: '#fff',
              color: '#363636',
              borderRadius: '4px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#4caf50',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f44336',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </UserProvider>
  );
};

export default App;