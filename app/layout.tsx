import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import DataLoader from "@/components/DataLoader";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="flex min-h-screen bg-[#f5f4f0]">
        <DataLoader>
          <Sidebar />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </DataLoader>
      </body>
    </html>
  );
}
