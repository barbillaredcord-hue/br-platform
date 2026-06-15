"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoUsers, type User } from "@/data/users";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { ensureProfile, getProfiles, getUserBeatAccess, mapProfileToUser } from "@/lib/supabase/queries";

type AuthResult = {
  ok: boolean;
  message?: string;
};

type UserContextValue = {
  currentUser: User | null;
  users: User[];
  authEmail: string;
  profileRole: string;
  brceoEnvEmail: string;
  setCurrentUser: (user: User | null) => void;
  loginAsUser: (email: string, password: string) => Promise<AuthResult>;
  registerUser: (input: { name: string; username: string; email: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoadingSession: boolean;
  authEnabled: boolean;
};

const UserContext = createContext<UserContextValue | null>(null);
const supabase = createSupabaseBrowserClient();

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

function getBrceoEnvEmail() {
  return normalizeEmail(process.env.NEXT_PUBLIC_BRCEO_EMAIL);
}

async function getUserFromAuthUser(authUser?: { id: string; email?: string | null } | null, input?: { name?: string; username?: string }): Promise<{ user: User | null; profileRole: string }> {
  if (!authUser?.email) {
    return { user: null, profileRole: "" };
  }

  const profile = await ensureProfile(authUser as Parameters<typeof ensureProfile>[0], input);
  const authEmail = normalizeEmail(authUser.email);
  const isBrceoEmail = authEmail === getBrceoEnvEmail();

  if (profile) {
    const profileRole = profile.role;
    const user = mapProfileToUser(
      {
        ...profile,
        email: normalizeEmail(profile.email),
        role: profileRole === "admin" || isBrceoEmail ? "admin" : "user",
      },
      await getUserBeatAccess(profile.id),
    );

    return { user, profileRole };
  }

  if (isBrceoEmail) {
    return {
      profileRole: "sin profile",
      user: {
        id: authUser.id,
        name: input?.name || "B.RCEO",
        username: input?.username || "brceo",
        email: authEmail,
        role: "admin",
        accessibleBeatIds: [],
      },
    };
  }

  return { user: null, profileRole: "sin profile" };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(demoUsers);
  const [authEmail, setAuthEmail] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(supabase));

  const refreshUsers = useCallback(async () => {
    const realUsers = await getProfiles();
    setUsers(realUsers.length ? realUsers : demoUsers);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const sessionUser = data.session?.user;
      const resolvedUser = await getUserFromAuthUser(sessionUser);
      setAuthEmail(normalizeEmail(sessionUser?.email));
      setProfileRole(resolvedUser.profileRole);
      setCurrentUser(resolvedUser.user);
      await refreshUsers();
      setIsLoadingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void getUserFromAuthUser(session?.user).then(async (resolvedUser) => {
        setAuthEmail(normalizeEmail(session?.user.email));
        setProfileRole(resolvedUser.profileRole);
        setCurrentUser(resolvedUser.user);
        await refreshUsers();
      });
      setIsLoadingSession(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refreshUsers]);

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

    const resolvedUser = await getUserFromAuthUser(data.user);
    setAuthEmail(normalizeEmail(data.user.email));
    setProfileRole(resolvedUser.profileRole);
    setCurrentUser(resolvedUser.user);
    await refreshUsers();
    return { ok: true };
  }, [refreshUsers]);

  const registerUser = useCallback(async (input: { name: string; username: string; email: string; password: string }) => {
    if (!supabase) {
      return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE };
    }

    const { data, error } = await supabase.auth.signUp({
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

    if (data.user) {
      const resolvedUser = await getUserFromAuthUser(data.user, input);
      setAuthEmail(normalizeEmail(data.user.email));
      setProfileRole(resolvedUser.profileRole);
      setCurrentUser(resolvedUser.user);
      await refreshUsers();
    }

    return { ok: true, message: "Cuenta creada. Revisa tu email si Supabase requiere confirmación." };
  }, [refreshUsers]);

  const logout = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    setCurrentUser(null);
    setAuthEmail("");
    setProfileRole("");
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!supabase) {
      return;
    }

    const { data } = await supabase.auth.getSession();
    const resolvedUser = await getUserFromAuthUser(data.session?.user);
    setAuthEmail(normalizeEmail(data.session?.user.email));
    setProfileRole(resolvedUser.profileRole);
    setCurrentUser(resolvedUser.user);
    await refreshUsers();
  }, [refreshUsers]);

  const brceoEnvEmail = getBrceoEnvEmail();
  const isAdmin = currentUser?.role === "admin" || (Boolean(authEmail) && authEmail === brceoEnvEmail);

  const value = useMemo(
    () => ({
      currentUser,
      users,
      authEmail,
      profileRole,
      brceoEnvEmail,
      setCurrentUser,
      loginAsUser,
      registerUser,
      logout,
      refreshCurrentUser,
      isAuthenticated: Boolean(currentUser),
      isAdmin,
      isLoadingSession,
      authEnabled: Boolean(supabase),
    }),
    [authEmail, brceoEnvEmail, currentUser, isAdmin, isLoadingSession, loginAsUser, logout, profileRole, refreshCurrentUser, registerUser, users],
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
