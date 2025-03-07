import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Gym App",
  description: "Personal workout tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.className} bg-zinc-950`}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          
          <main className="flex-grow container mx-auto py-4 sm:py-8 px-4 sm:px-6">
            {children}
          </main>
          
          <footer className="bg-zinc-900 text-zinc-400 py-4">
            <div className="container mx-auto px-4 text-center text-sm">
              <p>Personal Workout Tracker - Built with Next.js</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}