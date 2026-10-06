import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AssignMe — AI Academic Workspace",
  description:
    "AI-powered academic workspace for planning, research, writing, review, and export.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
