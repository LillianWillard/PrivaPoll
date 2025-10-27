"use client";

import { useApp } from "@/app/providers";

export function WalletConnect() {
  const { wallet } = useApp();

  if (wallet.isConnected && wallet.account) {
    return (
      <div className="flex items-center gap-3">
        <div className="glass px-4 py-2 rounded-lg">
          <span className="text-sm font-mono">
            {wallet.account.slice(0, 6)}...{wallet.account.slice(-4)}
          </span>
        </div>
        <button
          onClick={wallet.disconnectWallet}
          className="px-4 py-2 bg-error text-white rounded-lg hover:bg-red-600 transition-all"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => wallet.connectWallet()}
      disabled={wallet.isConnecting}
      className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}

