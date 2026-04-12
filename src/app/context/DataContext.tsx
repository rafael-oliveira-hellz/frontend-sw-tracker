import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  authenticateAccessToken,
  loginAuth,
  logoutAuth,
  refreshAuthSession,
  type AuthSessionDto,
  type LoginRequestDto,
} from "../lib/auth";
import type { User } from "../types";

type SessionUserData = {
  user: User;
};

type StoredAuthSession = AuthSessionDto;

type DataContextType = {
  userData: SessionUserData | null;
  isInitializing: boolean;
  accessToken: string | null;
  login: (usernameOrNumber: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
};

const SESSION_STORAGE_KEY = "summonersWarAuthSession";

const DataContext = createContext<DataContextType | undefined>(undefined);

const readStoredSession = (): StoredAuthSession | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    return null;
  }
};

const writeStoredSession = (session: StoredAuthSession | null) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

const toUserData = (session: StoredAuthSession | null): SessionUserData | null =>
  session ? { user: session.user } : null;

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<SessionUserData | null>(null);
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const clearSession = () => {
    writeStoredSession(null);
    setSession(null);
    setUserData(null);
  };

  const persistSession = (nextSession: StoredAuthSession) => {
    writeStoredSession(nextSession);
    setSession(nextSession);
    setUserData(toUserData(nextSession));
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedSession = readStoredSession();
      if (!storedSession) {
        setIsInitializing(false);
        return;
      }

      try {
        const user = await authenticateAccessToken({
          accessToken: storedSession.tokens.accessToken,
        });

        persistSession({
          ...storedSession,
          user,
        });
      } catch {
        try {
          const refreshedSession = await refreshAuthSession({
            refreshToken: storedSession.tokens.refreshToken,
          });
          persistSession(refreshedSession);
        } catch {
          clearSession();
        }
      } finally {
        setIsInitializing(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (usernameOrNumber: string, password: string): Promise<boolean> => {
    const request: LoginRequestDto = {
      usernameOrNumber,
      password,
    };

    const nextSession = await loginAuth(request);
    persistSession(nextSession);
    return true;
  };

  const logout = async () => {
    const currentSession = session ? readStoredSession() : null;
    try {
      if (currentSession) {
        await logoutAuth(
          { refreshToken: currentSession.tokens.refreshToken },
          currentSession.tokens.accessToken,
        );
      }
    } catch {
      // mantém o logout resiliente no cliente
    } finally {
      clearSession();
    }
  };

  const value = useMemo<DataContextType>(
    () => ({
      userData,
      isInitializing,
      accessToken: session?.tokens.accessToken ?? null,
      login,
      logout,
      isAdmin: () => userData?.user.role === "leader" || userData?.user.role === "vice-leader",
    }),
    [isInitializing, session, userData],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
