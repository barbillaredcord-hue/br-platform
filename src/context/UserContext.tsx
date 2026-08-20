"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoUsers, type User } from "@/data/users";
import { createAccessRefreshScheduler, isTransientAccessNetworkError, reconcileAccessState, subscribeToAccessChanges } from "@/lib/access-realtime";
import { notifyAccessStateChanged } from "@/lib/domain-events";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { ensureProfile, getProfiles, getUserBeatAccess, mapProfileToUser, updateProfile } from "@/lib/supabase/queries";

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
  registerUser: (input: { name: string; username: string; email: string; phone: string; password: string }) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoadingSession: boolean;
  isEmailConfirmed: boolean;
  authEnabled: boolean;
  inactiveAccountMessage: string;
};

const UserContext = createContext<UserContextValue | null>(null);
const supabase = createSupabaseBrowserClient();

function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

function getBrceoEnvEmail() {
  return normalizeEmail(process.env.NEXT_PUBLIC_BRCEO_EMAIL);
}

function isValidPhone(phone: string) {
  return /^[0-9+\-()\s]+$/.test(phone.trim()) && phone.replace(/\D/g, "").length >= 8;
}

function getIsEmailConfirmed(authUser?: { email_confirmed_at?: string | null; confirmed_at?: string | null } | null) {
  return Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
}

async function getUserFromAuthUser(authUser?: ({ id: string; email?: string | null } & { email_confirmed_at?: string | null; confirmed_at?: string | null }) | null, input?: { name?: string; username?: string; phone?: string }): Promise<{ user: User | null; profileRole: string }> {
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
        phone: input?.phone ?? null,
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
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(Boolean(supabase));
  const [inactiveAccountMessage, setInactiveAccountMessage] = useState("");

  const refreshUsers = useCallback(async () => {
    const realUsers = await getProfiles();
    setUsers(realUsers.length ? realUsers : demoUsers);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(async ({ data, error }) => {
      const sessionUser = error ? null : data.user;
      const resolvedUser = await getUserFromAuthUser(sessionUser);
      setAuthEmail(normalizeEmail(sessionUser?.email));
      setIsEmailConfirmed(getIsEmailConfirmed(sessionUser));
      setProfileRole(resolvedUser.profileRole);
      setCurrentUser(resolvedUser.user);
      if (sessionUser && !resolvedUser.user && resolvedUser.profileRole === "sin profile") {
        setInactiveAccountMessage("Tu cuenta ya no está activa.");
        await supabase.auth.signOut();
      } else {
        setInactiveAccountMessage("");
      }
      await refreshUsers();
      setIsLoadingSession(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void getUserFromAuthUser(session?.user).then(async (resolvedUser) => {
        setAuthEmail(normalizeEmail(session?.user.email));
        setIsEmailConfirmed(getIsEmailConfirmed(session?.user));
        setProfileRole(resolvedUser.profileRole);
        setCurrentUser(resolvedUser.user);
        if (session?.user && !resolvedUser.user && resolvedUser.profileRole === "sin profile") {
          setInactiveAccountMessage("Tu cuenta ya no está activa.");
          await supabase.auth.signOut();
        } else {
          setInactiveAccountMessage("");
        }
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

    const initialUser = await getUserFromAuthUser(data.user);
    if (!initialUser.user) {
      await supabase.auth.signOut();
      setInactiveAccountMessage("Tu cuenta ya no está activa.");
      return { ok: false, message: "Tu cuenta ya no está activa." };
    }

    const resolvedUser = await getUserFromAuthUser(data.user);
    setAuthEmail(normalizeEmail(data.user.email));
    setIsEmailConfirmed(getIsEmailConfirmed(data.user));
    setProfileRole(resolvedUser.profileRole);
    setCurrentUser(resolvedUser.user);
    setInactiveAccountMessage("");
    await refreshUsers();
    return { ok: true };
  }, [refreshUsers]);

  const registerUser = useCallback(async (input: { name: string; username: string; email: string; phone: string; password: string }) => {
    if (!supabase) {
      return { ok: false, message: SUPABASE_NOT_CONFIGURED_MESSAGE };
    }

    if (!isValidPhone(input.phone)) {
      return { ok: false, message: "Agrega tu teléfono para solicitar acceso." };
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          name: input.name,
          username: input.username,
          phone: input.phone,
        },
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    if (data.user) {
      if (data.session) {
        await updateProfile(data.user.id, { username: input.username, displayName: input.name, phone: input.phone });
      }

      await getUserFromAuthUser(data.user, input);
      const resolvedUser = await getUserFromAuthUser(data.user, input);
      setAuthEmail(normalizeEmail(data.user.email));
      setIsEmailConfirmed(getIsEmailConfirmed(data.user));
      setProfileRole(resolvedUser.profileRole);
      setCurrentUser(resolvedUser.user);
      setInactiveAccountMessage("");
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
    setIsEmailConfirmed(false);
    setProfileRole("");
    setInactiveAccountMessage("");
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!supabase) {
      return false;
    }

    return reconcileAccessState(
      async () => {
        const result = await supabase.auth.getUser();
        if (result.error && isTransientAccessNetworkError(result.error)) {
          throw result.error;
        }
        return result;
      },
      async ({ data, error }) => {
        const sessionUser = error ? null : data.user;
        const resolvedUser = await getUserFromAuthUser(sessionUser);
        setAuthEmail(normalizeEmail(sessionUser?.email));
        setIsEmailConfirmed(getIsEmailConfirmed(sessionUser));
        setProfileRole(resolvedUser.profileRole);
        setCurrentUser(resolvedUser.user);
        if (sessionUser && !resolvedUser.user && resolvedUser.profileRole === "sin profile") {
          setInactiveAccountMessage("Tu cuenta ya no está activa.");
          await supabase.auth.signOut();
        } else {
          setInactiveAccountMessage("");
        }
        await refreshUsers();
      },
    );
  }, [refreshUsers]);

  const brceoEnvEmail = getBrceoEnvEmail();
  const isAdmin = profileRole === "admin";

  useEffect(() => {
    if (!supabase || !currentUser?.id) {
      return;
    }

    let disposed = false;
    let unsubscribe: (() => Promise<unknown>) | null = null;
    const scheduler = createAccessRefreshScheduler(async () => {
      const refreshed = await refreshCurrentUser();
      if (refreshed) {
        notifyAccessStateChanged();
      }
    });
    const reconcile = () => scheduler.schedule();
    const reconcileVisible = () => {
      if (document.visibilityState === "visible") {
        reconcile();
      }
    };

    window.addEventListener("focus", reconcile);
    window.addEventListener("online", reconcile);
    document.addEventListener("visibilitychange", reconcileVisible);

    void subscribeToAccessChanges({
      supabase,
      userId: currentUser.id,
      onChange: reconcile,
      onStatus: (status) => {
        if (status === "SUBSCRIBED") {
          reconcile();
        }
      },
    }).then((cleanup) => {
      if (disposed) {
        void cleanup();
        return;
      }
      unsubscribe = cleanup;
    });

    return () => {
      disposed = true;
      scheduler.dispose();
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("online", reconcile);
      document.removeEventListener("visibilitychange", reconcileVisible);
      if (unsubscribe) {
        void unsubscribe();
      }
    };
  }, [currentUser?.id, refreshCurrentUser]);

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
      isEmailConfirmed,
      authEnabled: Boolean(supabase),
      inactiveAccountMessage,
    }),
    [authEmail, brceoEnvEmail, currentUser, inactiveAccountMessage, isAdmin, isEmailConfirmed, isLoadingSession, loginAsUser, logout, profileRole, refreshCurrentUser, registerUser, users],
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
