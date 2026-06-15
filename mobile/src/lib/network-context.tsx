import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface NetworkContextValue {
  isOnline: boolean;
  recheck: () => void;
}

const NetworkContext = createContext<NetworkContextValue>({ isOnline: true, recheck: () => {} });

async function checkOnline(): Promise<boolean> {
  try {
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recheck = async () => {
    const online = await checkOnline();
    setIsOnline(online);
  };

  useEffect(() => {
    recheck();
    // Poll every 10s while app is active
    intervalRef.current = setInterval(recheck, 10_000);

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') recheck();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline, recheck }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
