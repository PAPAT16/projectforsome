import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkRateLimit, logSecurityEvent, resetRateLimit, validateEmail, isStrongPassword } from '../utils/security';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'customer' | 'food_truck_owner') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser?.user_metadata?.avatar_url && data && !data.profile_image_url) {
      await supabase
        .from('profiles')
        .update({ profile_image_url: currentUser.user_metadata.avatar_url })
        .eq('id', userId);

      if (data) {
        setProfile({ ...data, profile_image_url: currentUser.user_metadata.avatar_url });
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'customer' | 'food_truck_owner') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const rateLimitCheck = await checkRateLimit(email, 'login', 5);

    if (!rateLimitCheck.allowed) {
      await logSecurityEvent(null, 'login', 'blocked', {
        email,
        reason: 'rate_limit_exceeded',
        blocked_until: rateLimitCheck.blockedUntil,
      });

      const minutesRemaining = rateLimitCheck.blockedUntil
        ? Math.ceil((rateLimitCheck.blockedUntil.getTime() - Date.now()) / 60000)
        : 15;

      throw new Error(`Too many login attempts. Please try again in ${minutesRemaining} minutes.`);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logSecurityEvent(null, 'login', 'failed', { email, error: error.message });
      throw error;
    }

    await resetRateLimit(email, 'login');
    await logSecurityEvent(null, 'login', 'success', { email });
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
      },
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
