"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { demoUser, demoUsers, type DemoUser } from "@/data/users";

type UserContextValue = {
  currentUser: DemoUser;
  users: DemoUser[];
  setCurrentUser: (user: DemoUser) => void;
};

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<DemoUser>(demoUser);

  const value = useMemo(
    () => ({
      currentUser,
      users: demoUsers,
      setCurrentUser,
    }),
    [currentUser],
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
