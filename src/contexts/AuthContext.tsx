import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signInWithGoogle as firebaseGoogleSignIn, signOut as firebaseSignOut, onAuthStateChangedListener } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { checkRateLimit, logSecurityEvent, resetRateLimit, validateEmail } from '../utils/security';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AppUser = (SupabaseUser | (FirebaseUser & { id?: string })) & {
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
};

interface AuthContextType {
  user: AppUser | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'customer' | 'food_truck_owner') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (useFirebase?: boolean) => Promise<void>;
  signOut: (useFirebase?: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirebaseUser, setIsFirebaseUser] = useState(false);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser?.user_metadata?.avatar_url && !data.profile_image_url) {
        await supabase
          .from('profiles')
          .update({ profile_image_url: currentUser.user_metadata.avatar_url })
          .eq('id', userId);

        setProfile({ ...data, profile_image_url: currentUser.user_metadata.avatar_url });
      }
    }
  };

  const refreshProfile = async () => {
    if (user && user.id) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setIsFirebaseUser(false);
        await fetchProfile(session.user.id);
      }
      if (!isFirebaseUser) {
        setLoading(false);
      }
    });

    // Set up Firebase auth listener
    const unsubscribeFirebase = onAuthStateChangedListener((firebaseUser) => {
      if (firebaseUser) {
        setUser({
          ...firebaseUser,
          id: firebaseUser.uid,
          email: firebaseUser.email,
          user_metadata: {
            full_name: firebaseUser.displayName,
            avatar_url: firebaseUser.photoURL
          }
        });
        setIsFirebaseUser(true);
        setSession(null);
        // For Firebase users, we'll fetch the profile using the UID
        fetchProfile(firebaseUser.uid).finally(() => setLoading(false));
      } else if (!session) {
        setLoading(false);
      }
    });

    // Initial session check
    const initAuth = async () => {
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (supabaseSession) {
        setSession(supabaseSession);
        setUser(supabaseSession.user);
        await fetchProfile(supabaseSession.user.id);
      }
      setLoading(false);
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
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

  const signInWithGoogle = async (useFirebase = false) => {
    setLoading(true);
    try {
      if (useFirebase) {
        const { user: firebaseUser } = await firebaseGoogleSignIn();
        if (!firebaseUser.id) throw new Error('No user ID returned from Google');
        
        // Create or update the user in your Supabase database
        // First, try to get the existing profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', firebaseUser.id)
          .single();

        // Create or update profile with all required fields
        const profileData = {
          id: firebaseUser.id,
          email: firebaseUser.email || '',
          full_name: (firebaseUser.user_metadata?.full_name || firebaseUser.email?.split('@')[0] || 'User') as string,
          profile_image_url: firebaseUser.user_metadata?.avatar_url || '',
          updated_at: new Date().toISOString(),
          created_at: existingProfile?.created_at || new Date().toISOString(),
          role: (existingProfile?.role || 'customer') as 'customer' | 'food_truck_owner' | 'admin',
          is_blocked: existingProfile?.is_blocked || false,
          user_id_number: existingProfile?.user_id_number || 0,
          referral_code: existingProfile?.referral_code || '',
          referred_by: existingProfile?.referred_by || null,
          subscription_status: existingProfile?.subscription_status || 'inactive',
          subscription_tier: existingProfile?.subscription_tier || 'free',
          phone: existingProfile?.phone || '',
          address: existingProfile?.address || '',
          city: existingProfile?.city || '',
          state: existingProfile?.state || '',
          zip_code: existingProfile?.zip_code || '',
          country: existingProfile?.country || '',
          header_image_url: existingProfile?.header_image_url || '',
          bio: existingProfile?.bio || '',
          notification_opt_in: existingProfile?.notification_opt_in || false,
          push_notifications_enabled: existingProfile?.push_notifications_enabled || false,
          email_notifications_enabled: existingProfile?.email_notifications_enabled || true,
        } as Profile;

        const { error } = await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });

        if (error) throw error;
        
        setProfile(profileData);
      } else {
        // Store the current URL to redirect back after OAuth
        localStorage.setItem('preAuthRoute', window.location.pathname);
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
        
        if (error) throw error;
        
        // If we get a URL, we can redirect there for the OAuth flow
        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (useFirebase = false) => {
    try {
      if (useFirebase || isFirebaseUser) {
        await firebaseSignOut();
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      setUser(null);
      setProfile(null);
      setSession(null);
      setIsFirebaseUser(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Create the context value with all required methods
  const contextValue: AuthContextType = {
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
  
  // Create the provider component with proper typing
  const Provider = AuthContext.Provider as React.Provider<AuthContextType>;
  
  // Use React.createElement to avoid JSX type issues
  return React.createElement(Provider, { value: contextValue }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
