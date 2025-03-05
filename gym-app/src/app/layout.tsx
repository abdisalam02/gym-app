import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gym Trainer App",
  description: "Your personal training companion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="bg-primary text-white shadow-md">
            <div className="container mx-auto py-4 px-6">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">FitCoach</h1>
                <nav>
                  <ul className="flex space-x-6">
                    <li><a href="#" className="hover:text-accent transition">Dashboard</a></li>
                    <li><a href="#" className="hover:text-accent transition">Workouts</a></li>
                    <li><a href="#" className="hover:text-accent transition">Nutrition</a></li>
                    <li><a href="#" className="hover:text-accent transition">Profile</a></li>
                  </ul>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-grow container mx-auto py-8 px-6">
            {children}
          </main>
          <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-6">
              <p className="text-center">&copy; 2025 FitCoach. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}