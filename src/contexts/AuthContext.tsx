import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, Session, User } from '@supabase/supabase-js';

// Demo mode configuration - replace with real Supabase credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key';

// Check if we're in demo mode (no real Supabase configured)
const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || supabaseUrl.includes('demo') || supabaseKey.includes('demo');

export const supabase = createClient(supabaseUrl, supabaseKey);

// Demo user for testing
const demoUser: User = {
  id: 'demo-user-123',
  email: 'demo@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: {},
};

const demoSession: Session = {
  access_token: 'demo-access-token',
  refresh_token: 'demo-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: demoUser,
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      // Demo mode - simulate authentication
      console.log('Running in demo mode - Supabase not configured');
      setLoading(false);
      return;
    }

    // Real Supabase mode
    try {
      // Get initial session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Supabase initialization error:', error);
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode - simulate successful signup
      setSession(demoSession);
      setUser(demoUser);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error('Authentication service unavailable. Running in demo mode.');
    }
  };

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      // Demo mode - simulate successful login
      setSession(demoSession);
      setUser(demoUser);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Authentication service unavailable. Running in demo mode.');
    }
  };

  const signOut = async () => {
    if (isDemoMode) {
      // Demo mode - simulate logout
      setSession(null);
      setUser(null);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      // Force logout even if Supabase fails
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}