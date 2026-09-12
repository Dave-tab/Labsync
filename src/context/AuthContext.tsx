import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, UserProfile, Role } from '../types';
import { auth, firebaseDb } from '../lib/firebaseService';
import { onAuthStateChanged, signOut as fbSignOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AuthContextType extends AuthState {
  login: (user: UserProfile) => void;
  logout: () => Promise<void>;
  signInWithFirebase: (email: string, pass: string) => Promise<UserProfile>;
  registerWithFirebase: (email: string, pass: string, profile: Partial<Omit<UserProfile, 'id' | 'email'>> & { first_name: string; last_name: string; role: Role }) => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Fetch user profile from Firestore
          const profile = await firebaseDb.users.get(fbUser.uid);
          if (profile) {
            setState({ user: profile, loading: false, error: null });
            localStorage.setItem('labsync_current_user', JSON.stringify(profile));
          } else {
            // Fallback to local session if profile is still propagating
            const stored = localStorage.getItem('labsync_current_user');
            setState({ user: stored ? JSON.parse(stored) : null, loading: false, error: null });
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          const stored = localStorage.getItem('labsync_current_user');
          setState({ user: stored ? JSON.parse(stored) : null, loading: false, error: null });
        }
      } else {
        // Check for offline/demo mock session
        const storedUser = localStorage.getItem('labsync_current_user');
        if (storedUser) {
          try {
            setState({ user: JSON.parse(storedUser), loading: false, error: null });
          } catch {
            setState({ user: null, loading: false, error: null });
          }
        } else {
          setState({ user: null, loading: false, error: null });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (user: UserProfile) => {
    localStorage.setItem('labsync_current_user', JSON.stringify(user));
    setState({ user, loading: false, error: null });
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    localStorage.removeItem('labsync_current_user');
    setState({ user: null, loading: false, error: null });
  };

  const signInWithFirebase = async (email: string, pass: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    let profile = await firebaseDb.users.get(cred.user.uid);
    if (!profile) {
      // Create fallback profile
      profile = {
        id: cred.user.uid,
        email: cred.user.email || email,
        first_name: 'User',
        last_name: '',
        role: 'student',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await firebaseDb.users.save(profile);
    }
    login(profile);
    return profile;
  };

  const registerWithFirebase = async (
    email: string, 
    pass: string, 
    profileData: Partial<Omit<UserProfile, 'id' | 'email'>> & { first_name: string; last_name: string; role: Role }
  ): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const newProfile: UserProfile = {
      id: cred.user.uid,
      email,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      role: profileData.role,
      faculty: profileData.faculty || '',
      department: profileData.department || '',
      level: profileData.level || '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await firebaseDb.users.save(newProfile);
    login(newProfile);
    return newProfile;
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, signInWithFirebase, registerWithFirebase }}>
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
