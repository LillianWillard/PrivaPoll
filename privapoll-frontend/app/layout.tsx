import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./providers";
import { Navbar } from "@/components/Navbar";
import { designTokens } from "@/design-tokens";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${designTokens.branding.name} - ${designTokens.branding.slogan}`,
  description: designTokens.branding.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-purple-900 min-h-screen`}>
        <AppProvider>
          <Navbar />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
