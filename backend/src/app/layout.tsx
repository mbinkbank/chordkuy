import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "ChordKu — Admin Panel",
  description: "Admin panel untuk aplikasi chord lagu worship ChordKu",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: "#1e293b", color: "#f8fafc", borderRadius: "8px" },
          }}
        />
      </body>
    </html>
  );
}
