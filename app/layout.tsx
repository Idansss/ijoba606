import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: {
    default: "IJOBA 606 · Learn PAYE, Play Quizzes & Calculate Tax | Nigeria",
    template: "%s | IJOBA 606",
  },
  description:
    "Make PAYE literacy engaging with quick quizzes, a warm community forum, tax consultants, and a practical PAYE calculator built for Nigeria.",
  keywords: ["PAYE", "Nigeria tax", "tax calculator", "tax quiz", "FIRS", "tax consultant", "income tax"],
  authors: [{ name: "IJOBA 606" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "IJOBA 606",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "IJOBA 606",
  description: "Make PAYE literacy engaging with quick quizzes, a warm community forum, tax consultants, and a practical PAYE calculator built for Nigeria.",
  url: "https://ijoba606.com",
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "NGN" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 min-h-screen">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KZZCMZDJTE"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-KZZCMZDJTE');
          `}
        </Script>
        <ThemeProvider>
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
        </ThemeProvider>
        </body>
    </html>
  );
}
