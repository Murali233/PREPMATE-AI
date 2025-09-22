import React, { createContext, useState, useEffect, useMemo, useContext } from "react";
import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

// Create a separate context file for better Fast Refresh support
const UserContext = createContext();

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Export the context for direct usage when needed
export { UserContext };

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // Check if user is authenticated
    const isAuthenticated = useMemo(() => {
        return !!user && !!user._id;
    }, [user]);

    // Initialize user from localStorage on mount
    useEffect(() => {
        const initializeUser = async () => {
            try {
                const token = localStorage.getItem("token");
                const storedUser = localStorage.getItem("user");
                
                if (!token || !storedUser) {
                    setLoading(false);
                    setInitialized(true);
                    return;
                }
                
                // Parse the stored user data
                const parsedUser = JSON.parse(storedUser);
                
                // If we have a token and user data, set the user
                if (token && parsedUser) {
                    // Verify the token is still valid by making an API call
                    try {
                        const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
                        setUser(response.data);
                    } catch (error) {
                        console.error("Token validation failed:", error);
                        // If token validation fails, clear the invalid data
                        clearUser();
                    }
                }
            } catch (error) {
                console.error("Error initializing user:", error);
                clearUser();
            } finally {
                setLoading(false);
                setInitialized(true);
            }
        };

        initializeUser();
    }, []);

    const updateUser = (userData) => {
        if (!userData) {
            clearUser();
            return;
        }
        
        // Ensure we have all required user fields
        const updatedUser = {
            _id: userData._id,
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'user',
            token: userData.token,
            isAuthenticated: true
        };
        
        setUser(updatedUser);
        localStorage.setItem("token", updatedUser.token);
        localStorage.setItem("user", JSON.stringify(updatedUser));
    };
    
    const clearUser = () => {
        setUser(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };
    
    const value = useMemo(() => ({
        user,
        loading: loading || !initialized,
        isAuthenticated,
        updateUser,
        clearUser
    }), [user, loading, initialized, isAuthenticated]);
    
    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

// Only export the provider as default
export default UserProvider;