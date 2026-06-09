import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "ARC — ניהול חברה",
  description: "מערכת ניהול פנימית של ARC אדריכלות חוויה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" style={{ colorScheme: "light" }}>
      <body className="flex min-h-screen bg-[#f5f4f0]">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </body>
    </html>
  );
}
