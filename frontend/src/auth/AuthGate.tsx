import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from 'oidc-client-ts';
import type { UserManager } from 'oidc-client-ts';
import { LogIn, LogOut, ShieldAlert } from 'lucide-react';

import { getAuthenticationConfigurationError, getUserManager } from './oidc';

interface AuthState {
  user: User;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);
let initializationPromise: Promise<User | null> | undefined;

function initializeSession(manager: UserManager): Promise<User | null> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await manager.clearStaleState();
      const isCallback = window.location.pathname === '/auth/callback';
      const loadedUser = isCallback
        ? await manager.signinRedirectCallback()
        : await manager.getUser();
      if (isCallback) window.history.replaceState({}, document.title, '/');
      return loadedUser && !loadedUser.expired ? loadedUser : null;
    })();
  }
  return initializationPromise;
}

export function useAuthentication(): AuthState {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuthentication must be used inside AuthGate');
  return value;
}

export const AuthGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(getAuthenticationConfigurationError());

  useEffect(() => {
    if (error) {
      setLoading(false);
      return;
    }
    const manager = getUserManager();
    const handleUserLoaded = (loadedUser: User) => setUser(loadedUser);
    const handleUserUnloaded = () => setUser(null);
    const initialize = async () => {
      try {
        setUser(await initializeSession(manager));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };
    manager.events.addUserLoaded(handleUserLoaded);
    manager.events.addUserUnloaded(handleUserUnloaded);
    manager.events.addAccessTokenExpired(handleUserUnloaded);
    void initialize();
    return () => {
      manager.events.removeUserLoaded(handleUserLoaded);
      manager.events.removeUserUnloaded(handleUserUnloaded);
      manager.events.removeAccessTokenExpired(handleUserUnloaded);
    };
  }, []);

  const signIn = useCallback(async () => {
    setError(null);
    await getUserManager().signinRedirect();
  }, []);
  const signOut = useCallback(async () => {
    const manager = getUserManager();
    try {
      await manager.signoutRedirect();
    } catch {
      await manager.removeUser();
      setUser(null);
    }
  }, []);
  const contextValue = useMemo(() => user ? { user, signOut } : null, [user, signOut]);

  if (loading) return <AuthStatus title="Establishing secure session…" />;
  if (error) return <AuthStatus title="Authentication unavailable" detail={error} severity="error" />;
  if (!user || !contextValue) {
    return (
      <AuthStatus title="Sign in to Psychs" detail="Your organization identity provider will authenticate this session.">
        <button onClick={() => void signIn()} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-300">
          <LogIn className="h-4 w-4" /> Continue with SSO
        </button>
      </AuthStatus>
    );
  }
  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const AuthSessionControl: React.FC = () => {
  const { user, signOut } = useAuthentication();
  const label = user.profile.email || user.profile.name || user.profile.sub;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-2 text-xs text-slate-300 shadow-xl">
      <span className="max-w-48 truncate">{label}</span>
      <button onClick={() => void signOut()} className="inline-flex items-center gap-1 text-slate-400 hover:text-white">
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </div>
  );
};

const AuthStatus: React.FC<React.PropsWithChildren<{ title: string; detail?: string; severity?: 'normal' | 'error' }>> = ({ title, detail, severity = 'normal', children }) => (
  <main className="flex min-h-screen items-center justify-center bg-[#060913] p-6 text-white">
    <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl">
      <ShieldAlert className={`mx-auto mb-5 h-10 w-10 ${severity === 'error' ? 'text-amber-400' : 'text-emerald-400'}`} />
      <h1 className="text-2xl font-semibold">{title}</h1>
      {detail && <p className="mt-3 text-sm text-slate-400">{detail}</p>}
      {children}
    </section>
  </main>
);
