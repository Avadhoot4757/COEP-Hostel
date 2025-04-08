"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null; // You can create a proper user type based on your backend
  login: (token: string, userData: any) => void;
  logout: () => void;
  token: string | null;
  loading: boolean;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: () => {},
  logout: () => {},
  token: null,
  loading: true,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      fetchUserData(storedToken);
    } else {
      setLoading(false);
    }
  }, []);
  
  // Fetch user data when token is available
  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/auth/user/', {
        headers: {
          'Authorization': `Token ${authToken}`,
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // If token is invalid, clear it
        logout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = (authToken: string, userData: any) => {
    localStorage.setItem('authToken', authToken);
    setToken(authToken);
    setUser(userData);
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        user,
        login,
        logout,
        token,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;