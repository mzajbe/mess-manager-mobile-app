import React, { createContext, useContext, useEffect, useState } from 'react';
import { Mess, MessMember, User } from '../types';

interface AuthContextType {
  user: User | null;
  mess: Mess | null;
  membership: MessMember | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  hasMess: boolean;
  isManager: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  createMess: (name: string, address?: string) => Promise<void>;
  joinMess: (inviteCode: string) => Promise<void>;
  refreshMess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Demo data for offline development
const DEMO_USER: User = {
  id: 'demo-user-1',
  email: 'demo@messmanager.app',
  fullName: 'Zajbe',
  phone: '+8801712345678',
  roomNumber: 'A-101',
  createdAt: new Date().toISOString(),
};

const DEMO_MESS: Mess = {
  id: 'demo-mess-1',
  name: 'Sunrise Mess',
  address: 'Dhaka, Bangladesh',
  inviteCode: 'SUN2026',
  createdBy: 'demo-user-1',
  mealSchedule: { breakfast: true, lunch: true, dinner: true },
  cutoffTime: '22:00',
  createdAt: new Date().toISOString(),
};

const DEMO_MEMBERSHIP: MessMember = {
  id: 'demo-member-1',
  messId: 'demo-mess-1',
  userId: 'demo-user-1',
  role: 'manager',
  joinedAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [membership, setMembership] = useState<MessMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-login with demo data for development
    // Replace with actual Supabase auth when credentials are configured
    setTimeout(() => {
      setUser(DEMO_USER);
      setMess(DEMO_MESS);
      setMembership(DEMO_MEMBERSHIP);
      setIsLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    // TODO: Replace with supabase.auth.signInWithPassword
    setTimeout(() => {
      setUser(DEMO_USER);
      setMess(DEMO_MESS);
      setMembership(DEMO_MEMBERSHIP);
      setIsLoading(false);
    }, 500);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    // TODO: Replace with supabase.auth.signUp
    setTimeout(() => {
      setUser({ ...DEMO_USER, email, fullName });
      setMess(null);
      setMembership(null);
      setIsLoading(false);
    }, 500);
  };

  const signOut = async () => {
    // TODO: Replace with supabase.auth.signOut
    setUser(null);
    setMess(null);
    setMembership(null);
  };

  const createMess = async (name: string, address?: string) => {
    // TODO: Replace with Supabase insert
    const newMess: Mess = {
      ...DEMO_MESS,
      name,
      address,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    };
    setMess(newMess);
    setMembership(DEMO_MEMBERSHIP);
  };

  const joinMess = async (inviteCode: string) => {
    // TODO: Replace with Supabase query
    setMess(DEMO_MESS);
    setMembership({ ...DEMO_MEMBERSHIP, role: 'member' });
  };

  const refreshMess = async () => {
    // TODO: Refresh mess data from Supabase
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        mess,
        membership,
        isLoading,
        isLoggedIn: !!user,
        hasMess: !!mess,
        isManager: membership?.role === 'manager',
        signIn,
        signUp,
        signOut,
        createMess,
        joinMess,
        refreshMess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
