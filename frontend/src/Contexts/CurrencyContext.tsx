"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getApiBaseUrl } from "@/app/login/action";
import { getAuthHeaders } from "@/utils/auth";
import { formatCurrency, getCurrencyPrefix, SUPPORTED_CURRENCIES } from "@/utils/currency";

interface CurrencyContextType {
  currency: string;
  currencyPrefix: string;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number | string | null | undefined, overrideCode?: string | null) => string;
  refreshCurrency: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "LKR",
  currencyPrefix: "Rs. ",
  setCurrency: () => {},
  formatAmount: (amount) => formatCurrency(amount, "LKR"),
  refreshCurrency: async () => {},
});

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("appDefaultCurrency") || "LKR";
    }
    return "LKR";
  });

  const refreshCurrency = useCallback(async () => {
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/SystemSettings`, {
        headers: getAuthHeaders(),
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const settings = await res.json();
        if (Array.isArray(settings)) {
          const currSetting = settings.find(
            (s: { settingKey?: string; category?: string }) =>
              s.settingKey?.toLowerCase() === "defaultcurrency"
          );
          if (currSetting && currSetting.settingValue) {
            const val = currSetting.settingValue.trim().toUpperCase();
            setCurrencyState(val);
            if (typeof window !== "undefined") {
              localStorage.setItem("appDefaultCurrency", val);
            }
          }
        }
      }
    } catch {
      // Keep existing cached currency
    }
  }, []);

  useEffect(() => {
    void refreshCurrency();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "appDefaultCurrency" && e.newValue) {
        setCurrencyState(e.newValue);
      }
    };
    const handleSettingsUpdated = () => {
      void refreshCurrency();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("systemSettingsUpdated", handleSettingsUpdated);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("systemSettingsUpdated", handleSettingsUpdated);
    };
  }, [refreshCurrency]);

  const setCurrency = (code: string) => {
    const normalized = code.trim().toUpperCase();
    setCurrencyState(normalized);
    if (typeof window !== "undefined") {
      localStorage.setItem("appDefaultCurrency", normalized);
      window.dispatchEvent(new CustomEvent("systemSettingsUpdated"));
    }
  };

  const formatAmount = useCallback(
    (amount: number | string | null | undefined, overrideCode?: string | null) => {
      return formatCurrency(amount, overrideCode || currency);
    },
    [currency]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyPrefix: getCurrencyPrefix(currency),
        setCurrency,
        formatAmount,
        refreshCurrency,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};
