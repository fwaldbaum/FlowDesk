import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Session and catalogue shared by every screen. All network work happens in the main process (window.zero).
const Ctx = createContext(null);
export const useZero = () => useContext(Ctx);

export function ZeroProvider({ children }) {
  const [info, setInfo] = useState(null);
  const [user, setUser] = useState(null);
  const [device, setDevice] = useState(null);
  const [apps, setApps] = useState(null);
  const [installed, setInstalled] = useState([]);
  const [booting, setBooting] = useState(true);
  const [offline, setOffline] = useState('');

  const loadAll = useCallback(async () => {
    const [me, list] = await Promise.all([window.zero.api('GET', '/me'), window.zero.api('GET', '/apps')]);
    setUser(me.user);
    setDevice(me.device);
    setApps(list.items);
    setOffline('');
  }, []);

  const boot = useCallback(async () => {
    const i = await window.zero.info();
    setInfo(i);
    setInstalled(i.installed);
    if (i.signedIn) {
      try {
        await loadAll();
      } catch (e) {
        if (e.status !== 401) setOffline(e.message);
      }
    }
    setBooting(false);
  }, [loadAll]);

  useEffect(() => {
    boot();
    return window.zero.onSessionEnded(() => {
      setUser(null);
      setApps(null);
    });
  }, [boot]);

  const value = {
    info,
    user,
    device,
    apps,
    installed,
    booting,
    offline,
    setUser,
    setInstalled,
    refresh: loadAll,
    retry: async () => {
      setBooting(true);
      await boot();
    },
    login: async (email, password) => {
      const res = await window.zero.login(email, password);
      setUser(res.user);
      await loadAll();
    },
    logout: async () => {
      await window.zero.logout();
      setUser(null);
      setApps(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
