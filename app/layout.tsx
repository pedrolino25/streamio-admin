import { ErrorBoundary } from "@/components/layout/error-boundary";
import { ToastProvider } from "@/components/ui/toast-container";
import { AuthProvider } from "@/lib/auth-context";
import { StoreProvider } from "@/lib/store/provider";
import { ThemeProvider } from "@/lib/theme-context";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Streamio Admin Panel",
  description: "Manage API keys and webhooks for the Media Processing Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <StoreProvider>
            <ThemeProvider>
              <AuthProvider>
                <ToastProvider>{children}</ToastProvider>
              </AuthProvider>
            </ThemeProvider>
          </StoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
