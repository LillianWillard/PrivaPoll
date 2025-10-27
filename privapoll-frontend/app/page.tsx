"use client";

import Link from "next/link";
import { useApp } from "./providers";
import { designTokens } from "@/design-tokens";

export default function Home() {
  const { wallet, fhevm } = useApp();

  return (
    <main className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-4">
      {/* Hero Section */}
      <div className="glass rounded-2xl p-8 md:p-12 max-w-5xl w-full shadow-glass">
        <div className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-primary">
            {designTokens.branding.name}
          </h1>
          <p className="text-xl md:text-2xl text-secondary">
            {designTokens.branding.slogan}
          </p>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            {designTokens.branding.description}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
          <div className="glass rounded-xl p-6 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Encrypted</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">0</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Data Leaks</p>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-primary mb-2">∞</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Privacy</p>
          </div>
        </div>

        {/* CTA Buttons */}
        {!wallet.isConnected ? (
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => wallet.connectWallet()}
              disabled={wallet.isConnecting}
              className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {wallet.isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/create"
              className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg inline-block"
            >
              Create Poll
            </Link>
            <Link
              href="/my-polls"
              className="glass hover:bg-white/30 px-8 py-3 rounded-lg font-semibold transition-all inline-block"
            >
              My Polls
            </Link>
          </div>
        )}

        {/* FHEVM Status */}
        {wallet.isConnected && (
          <div className="mt-8 p-4 glass rounded-lg">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">FHEVM Status:</span>
                <span className="ml-2 font-semibold">
                  {fhevm.status === "ready" && "✅ Ready"}
                  {fhevm.status === "loading" && "⏳ Loading..."}
                  {fhevm.status === "error" && "❌ Error"}
                  {fhevm.status === "idle" && "⚪ Idle"}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Network:</span>
                <span className="ml-2 font-semibold">
                  {wallet.chainId === 31337
                    ? "Localhost (Mock)"
                    : wallet.chainId === 11155111
                    ? "Sepolia"
                    : `Chain ${wallet.chainId}`}
                </span>
              </div>
            </div>
            {fhevm.error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
                <strong>Error:</strong> {fhevm.error.message}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by FHEVM • Built with ❤️ for Privacy</p>
        </div>
      </div>
    </main>
  );
}
