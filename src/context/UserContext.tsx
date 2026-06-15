"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { adminUser, demoUsers, type User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";

type AuthResult = {
  ok: boolean;
  message?: string;
};

type UserContextValue = {
  currentUser: User | null;
  users: User[];
  setCurrentUser: (user: User | null) => void;
  loginAsUser: (email: string, password: string) => Promise<AuthResult>;
  registerUser: (input: { name: string; username: string; email: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoadingSession: boolean;
  authEnabled: boolean;
};

const UserContext = createContext<UserContextValue | null>(null);
const supabase = createSupabaseBrowserClient();

function getUserFromEmail(email?: string | null): User | null {
  if (!email) {
    return null;
  }

  const normalizedEmail = email.toLowerCase();
  const brceoEmail = (process.env.NEXT_PUBLIC_BRCEO_EMAIL ?? "admin@br.local").toLowerCase();

  if (normalizedEmail === brceoEmail) {
    return { ...adminUser, email };
  }

  const demoUser = demoUsers.find((user) => user.email.toLowerCase() === normalizedEmail);

  if (demoUser) {
    return demoUser;
  }

  return {
    id: normalizedEmail,
    name: email.split("@")[0] || "Usuario B.R",
    username: email.split("@")[0] || "usuario",
    email,
    role: "user",
    accessibleBeatIds: [],
  };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setCurrentUser(getUserFromEmail(data.session?.user.email));
      setIsLoadingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(getUserFromEmail(session?.user.email));
      setIsLoadingSession(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const loginAsUser = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    setCurrentUser(getUserFromEmail(data.user.email));
    return { ok: true };
  }, []);

  const registerUser = useCallback(async (input: { name: string; username: string; email: string; password: string }) => {
    if (!supabase) {
      return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE };
    }

    const { error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          name: input.name,
          username: input.username,
        },
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true, message: "Cuenta creada. Revisa tu email si Supabase requiere confirmación." };
  }, []);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      users: demoUsers,
      setCurrentUser,
      loginAsUser,
      registerUser,
      logout,
      isAuthenticated: Boolean(currentUser),
      isAdmin: currentUser?.role === "admin",
      isLoadingSession,
      authEnabled: Boolean(supabase),
    }),
    [currentUser, isLoadingSession, loginAsUser, logout, registerUser],
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
