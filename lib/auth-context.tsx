"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AuthSession,
  signIn as authSignIn,
  signOut as authSignOut,
  AuthUser,
  getUserFromIdToken,
  NewPasswordRequiredChallenge,
  respondToNewPasswordChallenge,
  storage,
} from "./auth";
import { logger } from "./services/logger";
import { refreshSessionIfNeeded } from "./services/session-manager";

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<NewPasswordRequiredChallenge | void>;
  setNewPassword: (
    challenge: NewPasswordRequiredChallenge,
    newPassword: string
  ) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const saveAuthState = useCallback(
    (newSession: AuthSession, newUser: AuthUser) => {
      setSession(newSession);
      setUser(newUser);
      storage.set(newSession, newUser);
    },
    []
  );

  const clearAuthState = useCallback(() => {
    setSession(null);
    setUser(null);
    storage.clear();
  }, []);

  const refreshIfNeeded = useCallback(
    async (currentSession: AuthSession) => {
      const refreshed = await refreshSessionIfNeeded(currentSession);
      if (refreshed && refreshed.user) {
        saveAuthState(refreshed.session, refreshed.user);
      } else {
        clearAuthState();
      }
    },
    [saveAuthState, clearAuthState]
  );

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const stored = storage.get();

        if (stored && mounted) {
          setSession(stored.session);
          setUser(stored.user);

          await refreshIfNeeded(stored.session);
        }
      } catch (error) {
        logger.error("Error initializing auth", error);
        if (mounted) {
          clearAuthState();
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [refreshIfNeeded, clearAuthState]);

  useEffect(() => {
    if (!session) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshIfNeeded(session);
    }, REFRESH_INTERVAL);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [session, refreshIfNeeded]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const result = await authSignIn(email, password);

      if ("session" in result && "email" in result) {
        return result;
      }

      const newSession = result as AuthSession;
      const newUser = getUserFromIdToken(newSession.idToken);

      if (!newUser) {
        throw new Error("Failed to extract user information from token");
      }

      saveAuthState(newSession, newUser);
    },
    [saveAuthState]
  );

  const setNewPassword = useCallback(
    async (challenge: NewPasswordRequiredChallenge, newPassword: string) => {
      const newSession = await respondToNewPasswordChallenge(
        challenge.session,
        challenge.email,
        newPassword
      );
      const newUser = getUserFromIdToken(newSession.idToken);

      if (!newUser) {
        throw new Error("Failed to extract user information from token");
      }

      saveAuthState(newSession, newUser);
    },
    [saveAuthState]
  );

  const signOut = useCallback(() => {
    authSignOut();
    clearAuthState();
  }, [clearAuthState]);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      loading,
      signIn,
      setNewPassword,
      signOut,
    }),
    [user, session, loading, signIn, setNewPassword, signOut]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
