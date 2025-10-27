"use client";

import Link from "next/link";
import { WalletConnect } from "./WalletConnect";
import { designTokens } from "@/design-tokens";
import { useApp } from "@/app/providers";

export function Navbar() {
  const { wallet } = useApp();

  return (
    <nav className="glass border-b sticky top-0 z-sticky backdrop-blur-glass">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-primary">
              {designTokens.branding.name}
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/polls"
              className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
            >
              All Polls
            </Link>
            {wallet.isConnected && (
              <>
                <Link
                  href="/create"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  Create Poll
                </Link>
                <Link
                  href="/my-polls"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  My Polls
                </Link>
                <Link
                  href="/my-responses"
                  className="text-gray-700 dark:text-gray-300 hover:text-primary transition-colors"
                >
                  My Responses
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {wallet.chainId && (
              <div className="glass px-3 py-1 rounded-lg text-xs font-mono">
                {wallet.chainId === 31337
                  ? "Localhost"
                  : wallet.chainId === 11155111
                  ? "Sepolia"
                  : `Chain ${wallet.chainId}`}
              </div>
            )}
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}

