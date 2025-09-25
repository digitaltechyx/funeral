'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  role: 'member' | 'admin' | 'super_admin';
  status: 'Active' | 'Inactive';
  walletBalance: number;
  joinDate: string;
  stripeCustomerId?: string;
  emergencyContacts?: EmergencyContact[];
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone: string, role: 'member' | 'admin' | 'super_admin') => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user profile from Firestore
  const loadUserProfile = async (user: User) => {
    try {
      const userDoc = await getDoc(doc(db, 'members', user.uid));
      if (userDoc.exists()) {
        const profileData = userDoc.data();
        setUserProfile({
          uid: user.uid,
          email: user.email || '',
          name: profileData.name || '',
          phone: profileData.phone || '',
          role: profileData.role || 'member',
          status: profileData.status || 'Active',
          walletBalance: profileData.walletBalance || 0,
          joinDate: profileData.joinDate || new Date().toISOString(),
          stripeCustomerId: profileData.stripeCustomerId,
        });
      } else {
        // User doesn't have a profile yet, create one
        const defaultProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || '',
          phone: '',
          role: 'member', // Default role
          status: 'Active',
          walletBalance: 0,
          joinDate: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'members', user.uid), {
          ...defaultProfile,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        
        setUserProfile(defaultProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if this is the special super admin account
      if (email === 'digitaltechyx@gmail.com') {
        // Always update to super admin role for this email
        const superAdminProfile: UserProfile = {
          uid: userCredential.user.uid,
          email: email,
          name: 'Super Admin',
          phone: '',
          role: 'super_admin',
          status: 'Active',
          walletBalance: 0,
          joinDate: new Date().toISOString(),
        };

        // Update members collection
        await setDoc(doc(db, 'members', userCredential.user.uid), {
          ...superAdminProfile,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Update admin_users collection
        await setDoc(doc(db, 'admin_users', userCredential.user.uid), {
          email: email,
          name: 'Super Admin',
          role: 'super_admin',
          permissions: [
            'read_claims', 
            'approve_claims', 
            'charge_members', 
            'view_reports',
            'create_admins',
            'remove_admins',
            'manage_system'
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      await loadUserProfile(userCredential.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function (only for members)
  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    phone: string, 
    role: 'member' | 'admin' = 'member'
  ) => {
    try {
      setLoading(true);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name
      await updateProfile(userCredential.user, { displayName: name });
      
      // Create user profile in Firestore (only members can register)
      const userProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: email,
        name: name,
        phone: phone,
        role: 'member', // Always member for new registrations
        status: 'Active',
        walletBalance: 0,
        joinDate: new Date().toISOString(),
      };

      await setDoc(doc(db, 'members', userCredential.user.uid), {
        ...userProfile,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setUserProfile(userProfile);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    
    try {
      const updatedProfile = { ...userProfile, ...updates };
      await setDoc(doc(db, 'members', user.uid), {
        ...updatedProfile,
        updatedAt: new Date(),
      }, { merge: true });
      
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await loadUserProfile(user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
