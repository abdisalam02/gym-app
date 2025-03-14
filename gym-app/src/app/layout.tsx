import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import PWAInitializer from './components/PWAInitializer';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GymTrack Pro",
  description: "Track your workouts, progress, and fitness goals with ease",
  manifest: "/manifest.json",
  themeColor: "#38bdf8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymTrack",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "application-name": "GymTrack",
    "apple-mobile-web-app-title": "GymTrack",
    "msapplication-TileColor": "#38bdf8",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark">
      <head>
        {/* PWA meta tags */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`min-h-screen transition-colors duration-300 ${inter.className}`}>
        <Navbar />
        <main className="container mx-auto py-8 px-4">
          {children}
        </main>
        <PWAInitializer />
      </body>
    </html>
  );
}