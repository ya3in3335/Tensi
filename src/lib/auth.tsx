import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type User } from './api';

interface AuthState { user: User | null; ready: boolean; setUser: (u: User | null) => void; reload: () => Promise<User | null>; logout: () => Promise<void> }
const Ctx = createContext<AuthState>(null as never);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!api.signedIn);
  const reload = useCallback(async () => {
    if (!api.signedIn) { setUser(null); return null; }
    try { const r = await api.get<{ user: User }>('/api/me'); setUser(r.user); return r.user; } catch { return null; } finally { setReady(true); }
  }, []);
  useEffect(() => {
    api.onSessionEnd = () => setUser(null);
    void reload();
  }, [reload]);
  const logout = async () => { await api.logout(); setUser(null); };
  return <Ctx.Provider value={{ user, ready, setUser, reload, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
