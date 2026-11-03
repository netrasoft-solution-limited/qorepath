import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface AuthUser {
  id: string;
  email: string;
  role: 'learner' | 'instructor' | 'assistant' | 'admin';
  permissions?: string[];
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (stored && storedUser) {
      setToken(stored);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { data: me } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(me));
    setToken(data.accessToken);
    setUser(me);
  };

  const register = async (payload: RegisterData) => {
    const { data } = await api.post('/auth/register', payload);
    const { data: me } = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(me));
    setToken(data.accessToken);
    setUser(me);
  };

  const refreshUser = async () => {
    const { data: me } = await api.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(me));
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
