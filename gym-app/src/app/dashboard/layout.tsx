import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - MyGym",
  description: "Your personal workout dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 