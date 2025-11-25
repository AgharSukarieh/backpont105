import React, { createContext, useCallback, useEffect, useState } from "react";

export const UserContext = createContext();

const DEFAULT_USER = null;
const AUTH_USER_KEY = "auth-user";
const AUTH_SESSION_KEY = "auth-session";

const safeParse = (raw) => {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const buildUserFromSession = (session) => {
  if (!session) {
    return DEFAULT_USER;
  }

  const dto = session.responseUserDTO || {};

  return {
    ...dto,
    id: dto.id ?? null,
    name: dto.fullName ?? dto.userName ?? dto.name ?? session.username ?? null,
    email: dto.email ?? session.email ?? null,
    role: dto.role ?? session.role ?? "User",
    session,
  };
};

const loadUserFromStorage = () => {
  if (typeof window === "undefined") {
    return DEFAULT_USER;
  }

  const storedUser = safeParse(localStorage.getItem(AUTH_USER_KEY));
  if (storedUser) {
    return storedUser;
  }

  const storedSession = safeParse(localStorage.getItem(AUTH_SESSION_KEY));
  if (storedSession) {
    return buildUserFromSession(storedSession);
  }

  return DEFAULT_USER;
};

export const UserProvider = ({ children }) => {
  const [user, setUserState] = useState(() => loadUserFromStorage());

  const persistUser = useCallback((value) => {
    if (typeof window === "undefined") {
      return;
    }
    if (value === null || value === undefined) {
      localStorage.removeItem(AUTH_USER_KEY);
      return;
    }
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(value));
    } catch {
      // ignore storage failures
    }
  }, []);

  const setUser = useCallback(
    (updater) => {
      setUserState((prev) => {
        const nextValue = typeof updater === "function" ? updater(prev) : updater;
        persistUser(nextValue);
        return nextValue;
      });
    },
    [persistUser]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncFromStorage = () => {
      const latest = loadUserFromStorage();
      setUserState((prev) => {
        const prevString = JSON.stringify(prev ?? {});
        const nextString = JSON.stringify(latest ?? {});
        if (prevString === nextString) {
          return prev;
        }
        return latest;
      });
    };

    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("focus", syncFromStorage);

    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("focus", syncFromStorage);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};