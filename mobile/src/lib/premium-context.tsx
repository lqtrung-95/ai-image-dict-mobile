import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CustomerInfo } from 'react-native-purchases';
import { getCustomerInfo, isPremium, loginPurchases, logoutPurchases } from './purchases-service';

interface PremiumContextValue {
  isPremiumUser: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  onLogin: (userId: string) => void;
  onLogout: () => void;
}

const PremiumContext = createContext<PremiumContextValue>({
  isPremiumUser: false,
  customerInfo: null,
  loading: true,
  refresh: async () => {},
  onLogin: () => {},
  onLogout: () => {},
});

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const info = await getCustomerInfo();
    setCustomerInfo(info);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onLogin = useCallback((userId: string) => {
    loginPurchases(userId);
    refresh();
  }, [refresh]);

  const onLogout = useCallback(() => {
    logoutPurchases();
    setCustomerInfo(null);
  }, []);

  return (
    <PremiumContext.Provider value={{
      isPremiumUser: isPremium(customerInfo),
      customerInfo,
      loading,
      refresh,
      onLogin,
      onLogout,
    }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  return useContext(PremiumContext);
}
