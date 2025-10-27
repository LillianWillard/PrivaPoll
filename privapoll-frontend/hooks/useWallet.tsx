"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  account: string | null;
  chainId: number | null;
  provider: ethers.Eip1193Provider | null;
  signer: ethers.JsonRpcSigner | null;
  isConnected: boolean;
  isConnecting: boolean;
}

const STORAGE_KEYS = {
  connected: "wallet.connected",
  lastConnectorId: "wallet.lastConnectorId",
  lastAccounts: "wallet.lastAccounts",
  lastChainId: "wallet.lastChainId",
};

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    account: null,
    chainId: null,
    provider: null,
    signer: null,
    isConnected: false,
    isConnecting: false,
  });

  // Auto-reconnect on mount
  useEffect(() => {
    const wasConnected = localStorage.getItem(STORAGE_KEYS.connected) === "true";
    
    if (wasConnected && typeof window !== "undefined" && window.ethereum) {
      // Silent reconnection using eth_accounts (no popup)
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            connectWallet(window.ethereum);
          } else {
            // Clear stale connection state
            disconnectWallet();
          }
        })
        .catch((error: any) => {
          console.error("Auto-reconnect failed:", error);
          disconnectWallet();
        });
    }
  }, []);

  const connectWallet = useCallback(async (provider?: ethers.Eip1193Provider) => {
    try {
      setWalletState((prev) => ({ ...prev, isConnecting: true }));

      const selectedProvider = provider || (window as any).ethereum;
      
      if (!selectedProvider) {
        throw new Error("No wallet provider found");
      }

      // Request accounts
      const accounts = await selectedProvider.request({
        method: "eth_requestAccounts",
      });

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Get chain ID
      const chainIdHex = await selectedProvider.request({
        method: "eth_chainId",
      });
      const chainId = parseInt(chainIdHex, 16);

      // Create ethers provider and signer
      const ethersProvider = new ethers.BrowserProvider(selectedProvider);
      const signer = await ethersProvider.getSigner();

      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.connected, "true");
      localStorage.setItem(STORAGE_KEYS.lastAccounts, JSON.stringify(accounts));
      localStorage.setItem(STORAGE_KEYS.lastChainId, chainId.toString());

      setWalletState({
        account: accounts[0],
        chainId,
        provider: selectedProvider,
        signer,
        isConnected: true,
        isConnecting: false,
      });

      // Setup event listeners
      setupEventListeners(selectedProvider);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setWalletState((prev) => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.connected);
    localStorage.removeItem(STORAGE_KEYS.lastAccounts);
    localStorage.removeItem(STORAGE_KEYS.lastChainId);

    // Clear wallet state
    setWalletState({
      account: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnected: false,
      isConnecting: false,
    });

    // Clear decryption signatures
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("fhevm.decryptionSignature.")) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    if (!walletState.provider) {
      throw new Error("No provider available");
    }

    const chainIdHex = `0x${chainId.toString(16)}`;

    try {
      await walletState.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch (error: any) {
      // Chain doesn't exist, try to add it
      if (error.code === 4902) {
        // For Sepolia testnet
        if (chainId === 11155111) {
          await walletState.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: chainIdHex,
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "Sepolia ETH",
                  symbol: "SEP",
                  decimals: 18,
                },
                rpcUrls: ["https://sepolia.infura.io/v3/"],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        }
      } else {
        throw error;
      }
    }
  }, [walletState.provider]);

  const setupEventListeners = useCallback((provider: ethers.Eip1193Provider) => {
    const providerWithEvents = provider as any;
    
    // Account changed
    providerWithEvents.on("accountsChanged", (accounts: string[]) => {
      console.log("Accounts changed:", accounts);
      if (accounts && accounts.length > 0) {
        setWalletState((prev) => {
          if (!prev.provider) return prev;
          // Update account and re-create signer
          const ethersProvider = new ethers.BrowserProvider(prev.provider);
          ethersProvider.getSigner().then((signer) => {
            setWalletState((current) => ({
              ...current,
              account: accounts[0],
              signer,
            }));
          });
          return { ...prev, account: accounts[0] };
        });

        // Clear old account's decryption signature
        const oldAccount = localStorage.getItem(STORAGE_KEYS.lastAccounts);
        if (oldAccount) {
          const oldAccounts = JSON.parse(oldAccount);
          if (oldAccounts[0]) {
            localStorage.removeItem(`fhevm.decryptionSignature.${oldAccounts[0]}`);
          }
        }
        localStorage.setItem(STORAGE_KEYS.lastAccounts, JSON.stringify(accounts));
      } else {
        disconnectWallet();
      }
    });

    // Chain changed
    providerWithEvents.on("chainChanged", (chainIdHex: string) => {
      console.log("Chain changed:", chainIdHex);
      const chainId = parseInt(chainIdHex, 16);
      localStorage.setItem(STORAGE_KEYS.lastChainId, chainId.toString());
      
      setWalletState((prev) => {
        if (!prev.provider) return prev;
        // Re-create signer for new chain
        const ethersProvider = new ethers.BrowserProvider(prev.provider);
        ethersProvider.getSigner().then((signer) => {
          setWalletState((current) => ({
            ...current,
            chainId,
            signer,
          }));
        });
        return { ...prev, chainId };
      });
    });

    // Disconnect
    providerWithEvents.on("disconnect", () => {
      console.log("Provider disconnected");
      disconnectWallet();
    });
  }, [disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };
}

