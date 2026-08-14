import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isAuthEnabled } from '../lib/supabase';
import {
  pushUserDataNow,
  setActiveSyncUser,
  syncUserDataOnLogin,
} from '../lib/userDataSync';

interface AuthContextValue {
  authEnabled: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  syncing: boolean;
  syncError: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  clearSyncError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function restoreSessionData(userId: string): Promise<void> {
  setActiveSyncUser(userId);
  await syncUserDataOnLogin(userId);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authEnabled = isAuthEnabled();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(authEnabled);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSignedIn = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setActiveSyncUser(null);
      setUser(null);
      setSession(null);
      return;
    }

    setUser(nextSession.user);
    setSession(nextSession);
    setSyncError(null);
    setSyncing(true);

    try {
      await restoreSessionData(nextSession.user.id);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Could not sync your progress.');
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    if (!authEnabled) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      if (event === 'INITIAL_SESSION') {
        void handleSignedIn(nextSession).finally(() => {
          if (active) setLoading(false);
        });
        return;
      }

      if (event === 'SIGNED_IN') {
        void handleSignedIn(nextSession);
        return;
      }

      if (event === 'SIGNED_OUT') {
        setActiveSyncUser(null);
        setUser(null);
        setSession(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [authEnabled, handleSignedIn]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Sign-in is not configured.';

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    return error?.message ?? null;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { error: 'Sign-in is not configured.', needsConfirmation: false };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { error: error.message, needsConfirmation: false };
    }

    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    if (user) {
      try {
        await pushUserDataNow(user.id);
      } catch {
        // Continue sign-out even if the final sync fails.
      }
    }

    setActiveSyncUser(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [user]);

  const clearSyncError = useCallback(() => {
    setSyncError(null);
  }, []);

  const value = useMemo(
    () => ({
      authEnabled,
      user,
      session,
      loading,
      syncing,
      syncError,
      signIn,
      signUp,
      signOut,
      clearSyncError,
    }),
    [
      authEnabled,
      user,
      session,
      loading,
      syncing,
      syncError,
      signIn,
      signUp,
      signOut,
      clearSyncError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
