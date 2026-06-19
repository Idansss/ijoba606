import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastContainer } from "@/components/ui/Toast";
import { FCMProvider } from "@/components/FCMProvider";
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
  icons: {
    icon: "/ijoba606-logo-v2-icon.png",
    shortcut: "/ijoba606-logo-v2-icon.png",
    apple: "/ijoba606-logo-v2-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
      <body className="antialiased min-h-screen overflow-x-clip bg-cream-canvas text-on-surface font-body-md">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
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
            <FCMProvider />
            <div className="flex flex-col min-h-screen overflow-x-clip">
              <Header />
              <main className="flex-1 overflow-x-clip">
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
