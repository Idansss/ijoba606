import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "IJBoba 606 — Learn PAYE, Play Quizzes & Calculate Tax",
  description: "Make PAYE literacy engaging with quizzes, community forum, and a personal income tax calculator. Nigeria-ready, friendly, playful.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 min-h-screen">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
