import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "guest" | "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  avatar?: string;
  createdAt: string;
}

interface AuthState {
  role: Role;
  user: User | null;
  signIn: (role: Role, user: User) => void;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const defaultAuth: AuthState = {
  role: "guest",
  user: null,
  signIn: () => {
    if (import.meta?.env?.DEV) console.warn("useAuth: signIn called without provider; no-op");
  },
  signOut: () => {
    if (import.meta?.env?.DEV) console.warn("useAuth: signOut called without provider; no-op");
  },
  updateUser: () => {
    if (import.meta?.env?.DEV) console.warn("useAuth: updateUser called without provider; no-op");
  },
};

const AuthContext = createContext<AuthState>(defaultAuth);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(
    () => (localStorage.getItem("role") as Role) || "guest",
  );
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);
  useEffect(() => {
    localStorage.setItem("user", JSON.stringify(user));
  }, [user]);

  const signIn = (r: Role, u: User) => {
    setRole(r);
    setUser(u);
  };
  const signOut = () => {
    setRole("guest");
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
    }
  };

  const value = useMemo(() => ({ role, user, signIn, signOut, updateUser }), [role, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (import.meta?.env?.DEV && ctx === defaultAuth) {
    console.warn("useAuth used outside AuthProvider. Falling back to default no-op auth.");
  }
  return ctx;
}
