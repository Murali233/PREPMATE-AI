/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { LuSparkles } from "react-icons/lu";
import { useUser } from '../../context/userContext';
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { validateEmail } from "../../utils/helper";

const Login = ({ setCurrentPage }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { updateUser, isAuthenticated } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check for authentication messages or redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || 
                  new URLSearchParams(location.search).get('from') || 
                  '/dashboard';
      navigate(from, { replace: true });
      return;
    }
    
    const loginMessage = sessionStorage.getItem('loginMessage');
    if (loginMessage) {
      toast(loginMessage, { 
        icon: 'ℹ️',
        duration: 5000,
      });
      sessionStorage.removeItem('loginMessage');
    }
    
    const errorMessage = new URLSearchParams(location.search).get('error');
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAuthenticated, location, navigate]);
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
        email,
        password,
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true
      });
      
      const token = response.data?.token || response.data?.data?.token;
      const userData = response.data?.data || response.data || {};
      
      if (!token) throw new Error('No authentication token received');
      
      const user = {
        _id: userData._id || Date.now().toString(),
        name: userData.name || email.split('@')[0],
        email: userData.email || email,
        role: userData.role || 'user',
        token: token,
        isAuthenticated: true
      };
      
      // Update user context and local storage
      updateUser(user);
      
      // Store tokens in localStorage if they exist in response
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
      
      // Determine redirect path
      const searchParams = new URLSearchParams(location.search);
      let redirectPath = 
        location.state?.from?.pathname || 
        searchParams.get('from') || 
        localStorage.getItem('redirectAfterLogin') || 
        '/dashboard';
      
      // Clean up stored redirect URL
      localStorage.removeItem('redirectAfterLogin');
      
      // Ensure we're not redirecting back to auth pages
      const authPaths = ['/login', '/signup', '/auth'];
      if (authPaths.some(path => redirectPath.startsWith(path))) {
        redirectPath = '/dashboard';
      }
      
      console.log('Redirecting to:', redirectPath);
      
      // Show success message
      toast.success('Login successful! Redirecting...');
      
      // Small delay to show the success message
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500);
    } catch (error) {
      console.error('Login error:', error);
      
      // Default error message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response) {
        // Server responded with an error status
        const { status, data } = error.response;
        console.error('Error response:', { status, data });
        
        switch (status) {
          case 400:
            errorMessage = data.message || 'Invalid request. Please check your input.';
            break;
          case 401:
            errorMessage = data.message || 'Invalid email or password. Please try again.';
            break;
          case 403:
            errorMessage = data.message || 'Access denied. You do not have permission to access this resource.';
            break;
          case 404:
            errorMessage = 'The requested resource was not found.';
            break;
          case 429:
            errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later or contact support if the problem persists.';
            break;
          default:
            errorMessage = data?.message || `Error ${status}: An error occurred during login.`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response received:', error.request);
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.message) {
        // Error in request setup
        console.error('Request setup error:', error.message);
        errorMessage = `Request error: ${error.message}`;
      }
      
      // Update error state and show toast
      setError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full min-h-screen bg-[#FFFCEF] flex items-center justify-center p-4">
      <div className="w-[500px] h-[500px] bg-amber-200/20 blur-[65px] absolute top-0 left-0" />
      
      <div className="w-full max-w-md relative z-10 bg-white p-8 rounded-xl shadow-lg border border-amber-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to continue to PREPMATE AI</p>
          
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
        
        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <a href="#" className="text-sm text-amber-600 hover:text-amber-500">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-full text-sm font-semibold text-white bg-gradient-to-r from-[#FF9324] to-[#e99a4b] hover:from-[#e98a1a] hover:to-[#d98a3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
          
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-amber-600 hover:text-amber-500"
              onClick={(e) => {
                if (isLoading) {
                  e.preventDefault();
                }
              }}
            >
              Sign up
            </Link>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default Login;
