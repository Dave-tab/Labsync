import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, UserProfile } from '../types';

interface AuthContextType extends AuthState {
  login: (user: UserProfile) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for existing session in localStorage
    const storedUser = localStorage.getItem('labsync_current_user');
    if (storedUser) {
      try {
        setState({ user: JSON.parse(storedUser), loading: false, error: null });
      } catch (e) {
        setState({ user: null, loading: false, error: null });
      }
    } else {
      setState({ user: null, loading: false, error: null });
    }
  }, []);

  const login = (user: UserProfile) => {
    // Store session
    localStorage.setItem('labsync_current_user', JSON.stringify(user));
    setState({ user, loading: false, error: null });
  };

  const logout = () => {
    // Clear session
    localStorage.removeItem('labsync_current_user');
    setState({ user: null, loading: false, error: null });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
