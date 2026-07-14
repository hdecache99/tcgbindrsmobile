import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from './supabase';
import { getProfile } from './profile';

const CurrencyContext = createContext({ currency: 'USD', refreshCurrency: () => {} });

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');

  const refreshCurrency = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setCurrency('USD');
      return;
    }
    try {
      const profile = await getProfile();
      setCurrency(profile?.currency || 'USD');
    } catch {
      // Sin perfil todavía (ej. justo después de signup) — se queda en USD
      // hasta el próximo refresh.
    }
  }, []);

  useEffect(() => {
    refreshCurrency();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') refreshCurrency();
      if (event === 'SIGNED_OUT') setCurrency('USD');
    });
    return () => subscription.subscription.unsubscribe();
  }, [refreshCurrency]);

  return (
    <CurrencyContext.Provider value={{ currency, refreshCurrency }}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
