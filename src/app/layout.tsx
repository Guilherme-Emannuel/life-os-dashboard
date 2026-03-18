import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/query-provider";
import { QuickCaptureFloating } from "@/components/quick-capture-floating";
import { NotificationBanner } from "@/components/notification-banner";
import { ToastProvider } from "@/components/toast-provider";
import { EventNotifier } from "@/components/event-notifier";
import { RealtimeMonitorProvider } from "@/components/realtime-monitor-provider";
import { AuthProvider } from "@/components/auth-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#3b82f6",
};

export const metadata: Metadata = {
  title: "Life OS Dashboard",
  description: "Dashboard de gestão pessoal com baixa carga cognitiva",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Life OS Dashboard",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Life OS Dashboard",
    title: "Life OS Dashboard",
    description: "Dashboard de gestão pessoal com baixa carga cognitiva",
  },
  twitter: {
    card: "summary",
    title: "Life OS Dashboard",
    description: "Dashboard de gestão pessoal com baixa carga cognitiva",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-slate-50 text-slate-900`}
      >
        <AuthProvider>
          <QueryProvider>
            <RealtimeMonitorProvider>
              {children}
              <QuickCaptureFloating />
              <NotificationBanner />
              <ToastProvider />
              <EventNotifier />
            </RealtimeMonitorProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}


