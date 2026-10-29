import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import seedUsers from "./users.json";
import AuthModal from "./AuthModal";
import "./AuthModal.css";

const SESSION_KEY = "localified_user";
const ACCOUNTS_KEY = "localified_accounts";

const AuthContext = createContext(null);

function loadLocalAccounts() {
  try {
    const stored = localStorage.getItem(ACCOUNTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* ignore */
  }
  return seedUsers.map((user) => ({ ...user }));
}

function saveLocalAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function profileFromRow(row, authUser) {
  if (!row && !authUser) return null;
  return {
    id: row?.id || authUser?.id,
    firstName: row?.first_name || authUser?.user_metadata?.first_name || "",
    lastName: row?.last_name || authUser?.user_metadata?.last_name || "",
    email: row?.email || authUser?.email || "",
    birthDate: row?.birth_date || authUser?.user_metadata?.birth_date || "",
    phone: row?.phone || authUser?.user_metadata?.phone || "",
    role: row?.role || authUser?.user_metadata?.role || "client",
    picture: row?.picture || "",
  };
}

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [localAccounts, setLocalAccounts] = useState(loadLocalAccounts);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (isSupabaseConfigured) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && !cancelled) {
          try {
            const profile = await fetchProfile(session.user.id);
            setUser(profileFromRow(profile, session.user));
          } catch {
            setUser(profileFromRow(null, session.user));
          }
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
          if (!nextSession?.user) {
            setUser(null);
            return;
          }
          try {
            const profile = await fetchProfile(nextSession.user.id);
            setUser(profileFromRow(profile, nextSession.user));
          } catch {
            setUser(profileFromRow(null, nextSession.user));
          }
        });

        if (!cancelled) setReady(true);
        return () => subscription.unsubscribe();
      }

      try {
        const stored = localStorage.getItem(SESSION_KEY);
        if (stored && !cancelled) setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
      if (!cancelled) setReady(true);
      return undefined;
    }

    const cleanupPromise = boot();
    return () => {
      cancelled = true;
      Promise.resolve(cleanupPromise).then((cleanup) => cleanup?.());
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    saveLocalAccounts(localAccounts);
  }, [localAccounts]);

  // Login is required — keep the auth gate open until a session exists.
  useEffect(() => {
    if (ready && !user) setAuthOpen(true);
  }, [ready, user]);

  const persistLocalUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (nextUser) localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => {
    // Guests cannot dismiss the required login gate.
    if (!user) return;
    setAuthOpen(false);
  }, [user]);

  const login = useCallback(
    async ({ email, password }) => {
      const normalized = email.trim().toLowerCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalized,
          password,
        });
        if (error)
          throw new Error(error.message || "Incorrect email or password.");
        const profile = await fetchProfile(data.user.id);
        const nextUser = profileFromRow(profile, data.user);
        setUser(nextUser);
        setAuthOpen(false);
        return nextUser;
      }

      const match = localAccounts.find(
        (account) => account.email.toLowerCase() === normalized,
      );
      if (!match || match.password !== password) {
        throw new Error("Incorrect email or password. Please try again.");
      }
      const { password: _pw, ...safeUser } = match;
      persistLocalUser(safeUser);
      setAuthOpen(false);
      return safeUser;
    },
    [localAccounts, persistLocalUser],
  );

  const signUp = useCallback(
    async (form) => {
      const email = form.email.trim().toLowerCase();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: form.password,
          options: {
            data: {
              first_name: form.firstName.trim(),
              last_name: form.lastName.trim(),
              birth_date: form.birthDate,
              phone: form.phone.trim(),
              role: form.role,
            },
          },
        });
        if (error)
          throw new Error(error.message || "Could not create account.");
        if (!data.user) throw new Error("Could not create account.");

        const profilePayload = {
          id: data.user.id,
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          email,
          birth_date: form.birthDate || null,
          phone: form.phone.trim(),
          role: form.role,
        };

        // Profile may already exist via the auth trigger; upsert covers both cases.
        await supabase.from("profiles").upsert(profilePayload);

        // Email confirmation may be required — no session until confirmed.
        if (!data.session) {
          throw new Error(
            "Account created. Confirm your email, then log in. (Or disable email confirmation in Supabase Auth settings for local testing.)",
          );
        }

        const nextUser = profileFromRow(profilePayload, data.user);
        setUser(nextUser);
        setAuthOpen(false);
        return nextUser;
      }

      if (
        localAccounts.some((account) => account.email.toLowerCase() === email)
      ) {
        throw new Error("That email is already registered.");
      }

      const newAccount = {
        id: `local-${Date.now()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email,
        birthDate: form.birthDate,
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
      };
      setLocalAccounts((current) => [...current, newAccount]);
      const { password: _pw, ...safeUser } = newAccount;
      persistLocalUser(safeUser);
      setAuthOpen(false);
      return safeUser;
    },
    [localAccounts, persistLocalUser],
  );

  const recoverPassword = useCallback(
    async (email) => {
      const normalized = email.trim().toLowerCase();

      if (isSupabaseConfigured) {
        const redirectTo = `${window.location.origin}/job-board`;
        const { error } = await supabase.auth.resetPasswordForEmail(
          normalized,
          {
            redirectTo,
          },
        );
        if (error)
          throw new Error(error.message || "Could not send reset email.");
        return { mode: "email-sent" };
      }

      const found = localAccounts.some(
        (account) => account.email.toLowerCase() === normalized,
      );
      if (!found) {
        throw new Error("No account was found with that email address.");
      }
      return { mode: "local-reset" };
    },
    [localAccounts],
  );

  const resetPassword = useCallback(async ({ email, password }) => {
    const normalized = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message || "Could not update password.");
      return;
    }

    let updated = false;
    setLocalAccounts((current) =>
      current.map((account) => {
        if (account.email.toLowerCase() !== normalized) return account;
        updated = true;
        return { ...account, password };
      }),
    );
    if (!updated) throw new Error("That account could not be found.");
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
      setUser(null);
    } else {
      persistLocalUser(null);
    }
    setAuthOpen(true);
  }, [persistLocalUser]);

  const updateUser = useCallback(
    async (patch) => {
      const nextUser = { ...user, ...patch };
      setUser(nextUser);

      if (isSupabaseConfigured && user?.id) {
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: nextUser.firstName,
            last_name: nextUser.lastName,
            phone: nextUser.phone,
            role: nextUser.role,
            birth_date: nextUser.birthDate || null,
            picture: nextUser.picture || null,
          })
          .eq("id", user.id);
        if (error)
          throw new Error(error.message || "Could not update profile.");
        return nextUser;
      }

      setLocalAccounts((current) =>
        current.map((account) =>
          account.id === nextUser.id
            ? { ...account, ...patch, password: account.password }
            : account,
        ),
      );
      localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
      return nextUser;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      authOpen,
      openAuth,
      closeAuth,
      login,
      signUp,
      recoverPassword,
      resetPassword,
      logout,
      updateUser,
      isSupabaseConfigured,
      displayName: user
        ? `${user.firstName} ${user.lastName}`.trim() || user.email
        : "",
    }),
    [
      user,
      ready,
      authOpen,
      openAuth,
      closeAuth,
      login,
      signUp,
      recoverPassword,
      resetPassword,
      logout,
      updateUser,
    ],
  );

  const loginRequired = ready && !user;

  return (
    <AuthContext.Provider value={value}>
      {ready && user ? children : null}
      {ready && !user && <div className="auth-boot-shell" aria-hidden="true" />}
      {(authOpen || loginRequired) && ready && (
        <AuthModal
          required={loginRequired}
          onClose={closeAuth}
          user={user}
          onLogin={login}
          onLogout={logout}
          onSignUp={signUp}
          onRecover={recoverPassword}
          onReset={resetPassword}
          onUpdateUser={updateUser}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
