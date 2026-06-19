import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/ui/toast";

import Script from "next/script";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.cognaralearn.com'),
  title: "Cognara — AI Learning Operating System",
  description: "Your mind. Your path. Your era. Dynamically generated personalized roadmaps, lessons, and quizzes.",
  keywords: [
    "Cognara", "Cognaralearn", "AI learning", "personalized roadmaps", 
    "adaptive learning", "AI education", "study planner", "learning operating system"
  ],
  authors: [{ name: "Cognara Team" }],
  openGraph: {
    title: "Cognara — AI Learning Operating System",
    description: "Your mind. Your path. Your era. Dynamically generated personalized roadmaps, lessons, and quizzes.",
    url: "https://www.cognaralearn.com",
    siteName: "Cognara",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Cognara Logo",
      }
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cognara — AI Learning Operating System",
    description: "Your mind. Your path. Your era. Dynamically generated personalized roadmaps, lessons, and quizzes.",
    images: ["/logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('cognara-theme');
                var theme = saved || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                // Font size is always normal — large mode was removed
                localStorage.removeItem('cognara-font-size');
                document.documentElement.style.setProperty('--text-base', '15px');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text-1">
        <ToastProvider>
          <QueryProvider>{children}</QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
