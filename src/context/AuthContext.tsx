import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Role = "admin" | "gestor";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  farm?: string;
  createdAt: string;
}

interface AuthCtx {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  createGestor: (data: { name: string; email: string; password: string; farm?: string }) => { ok: boolean; error?: string };
  removeGestor: (id: string) => void;
  updateGestor: (u: User) => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const SESSION_KEY = "Raizal:session";
const USERS_KEY = "Raizal:users";

const seedUsers: User[] = [
  {
    id: "u-admin",
    name: "Administrador",
    email: "admin@Raizal.com",
    password: "admin123",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "u-gestor",
    name: "João Marques",
    email: "gestor@Raizal.com",
    password: "gestor123",
    role: "gestor",
    farm: "Fazenda Boa Vista",
    createdAt: new Date().toISOString(),
  },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === "undefined") return seedUsers;
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return seedUsers;
    try {
      const parsed = JSON.parse(raw) as User[];
      const hasAdmin = parsed.some((u) => u.role === "admin");
      return hasAdmin ? parsed : [...seedUsers.filter((u) => u.role === "admin"), ...parsed];
    } catch {
      return seedUsers;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(SESSION_KEY);
  }, [user]);

  const value = useMemo<AuthCtx>(() => ({
    user,
    users,
    login: (email, password) => {
      const found = users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
      );
      if (!found) return { ok: false, error: "E-mail ou senha inválidos" };
      setUser(found);
      return { ok: true };
    },
    logout: () => setUser(null),
    createGestor: ({ name, email, password, farm }) => {
      if (!name || !email || !password) return { ok: false, error: "Preencha todos os campos" };
      if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        return { ok: false, error: "Já existe um usuário com este e-mail" };
      }
      const novo: User = {
        id: uid(),
        name,
        email: email.trim(),
        password,
        farm,
        role: "gestor",
        createdAt: new Date().toISOString(),
      };
      setUsers((state) => [...state, novo]);
      return { ok: true };
    },
    removeGestor: (id) => setUsers((state) => state.filter((u) => u.id !== id || u.role === "admin")),
    updateGestor: (u) => setUsers((state) => state.map((item) => (item.id === u.id ? u : item))),
  }), [user, users]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const context = useContext(Ctx);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
