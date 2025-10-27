"use client";

import { createContext, useContext, ReactNode } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useFhevm } from "@/fhevm/useFhevm";

interface AppContextType {
  wallet: ReturnType<typeof useWallet>;
  fhevm: ReturnType<typeof useFhevm>;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  
  const fhevm = useFhevm({
    provider: wallet.provider || undefined,
    chainId: wallet.chainId || undefined,
    enabled: wallet.isConnected,
    initialMockChains: {
      31337: "http://localhost:8545",
    },
  });

  return (
    <AppContext.Provider value={{ wallet, fhevm }}>
      {children}
    </AppContext.Provider>
  );
}

