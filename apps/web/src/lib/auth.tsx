import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from './api';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; phone: string; password: string; role: string; barNumber?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = localStorage.getItem('auth_token');
      const u = localStorage.getItem('auth_user');
      if (t) setToken(t);
      if (u) {
        try {
          setUser(JSON.parse(u));
        } catch {}
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, user } = data;
    setToken(accessToken);
    setUser(user);
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const register = async (payload: { name: string; email: string; phone: string; password: string; role: string; barNumber?: string }) => {
    const { data } = await api.post('/auth/register', payload);
    const { accessToken, user } = data;
    setToken(accessToken);
    setUser(user);
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
