import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from './supabase-client';

// Required so the in-app browser closes itself after the OAuth redirect
WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  /** Returns true when a session was created; false when email confirmation is pending */
  signup: (email: string, password: string, displayName?: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function sessionToUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    displayName: (meta.display_name as string) ?? (meta.full_name as string) ?? null,
    avatarUrl: (meta.avatar_url as string) ?? null,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore persisted session on launch, then track auth changes
    supabase.auth.getSession().then(({ data }) => {
      setUser(sessionToUser(data.session));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(sessionToUser(session));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  };

  // OAuth flow for native: open the Supabase-hosted Google consent page in an
  // in-app browser, then build the session from the tokens in the redirect URL.
  // The redirect URL printed below must be added to Supabase Auth → URL Configuration.
  const loginWithGoogle = async () => {
    const redirectTo = AuthSession.makeRedirectUri();
    console.log('OAuth redirect URL (must be allowed in Supabase):', redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw new Error(error.message);

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    console.log('OAuth browser result:', result.type, 'url' in result ? result.url : '(no url)');
    if (result.type !== 'success') return; // user cancelled

    const { params, errorCode } = QueryParams.getQueryParams(result.url);
    console.log('OAuth callback params:', Object.keys(params).join(','), '| errorCode:', errorCode);
    if (errorCode) throw new Error(errorCode);

    if (params.access_token && params.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: params.access_token,
        refresh_token: params.refresh_token,
      });
      if (sessionError) throw new Error(sessionError.message);
    } else if (params.code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
      if (exchangeError) throw new Error(exchangeError.message);
    } else {
      throw new Error('No auth tokens returned from Google sign-in');
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName ?? email.split('@')[0] } },
    });
    if (error) throw new Error(error.message);
    // With email confirmation enabled, Supabase returns a user but no session
    return data.session !== null;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, loginWithGoogle, signup, resetPassword, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
