"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { demoUsers, type User } from "@/data/users";

type UserContextValue = {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  loginAsUser: (email: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const loginAsUser = useCallback((email: string) => {
    const user = demoUsers.find((item) => item.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return false;
    }

    setCurrentUser(user);
    return true;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      users: demoUsers,
      setCurrentUser,
      loginAsUser,
      logout,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.role === "admin",
    }),
    [currentUser, loginAsUser, logout],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }

  return context;
}
