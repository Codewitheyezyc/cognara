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
  title: 'Cognara — Your goal. Your roadmap. Your AI mentor.',
  description: 'Whatever you want to achieve, Cognara builds your personalised learning path, teaches you at your exact level, and keeps you accountable every single day.',
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.png", type: "image/png" }
    ],
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  keywords: [
    "Cognara", "Cognaralearn", "cognitive learning", "personalized roadmaps",
    "adaptive learning", "cognitive education", "study planner", "learning operating system", "AI learning platform", "AI achievement platform", "personalised learning", "adaptive learning", "AI mentor", "learning roadmap", "structured learning", "online learning", "e-learning", "self-paced learning", "achieve your goals", "learn new skills", "skill development", "personal development", "career development", "upskilling", "reskilling", "professional development", "lifelong learning", "goal setting", "online learning Nigeria", "e-learning Nigeria", "learn online Nigeria", "AI platform Nigeria", "education technology Nigeria", "edtech Nigeria", "online courses Nigeria", "skill acquisition Nigeria", "self development Nigeria", "career growth Nigeria", "learn from home Nigeria", "Africa edtech", "online learning Africa", "learning accountability", "study consistency", "daily learning", "learning streak", "stay motivated to learn", "finish what you started", "learning habit", "consistent learning", "AI tutor", "personal AI coach", "AI study partner", "smart learning app", "intelligent learning platform", "learn social media marketing", "learn business strategy", "learn web development", "learn programming", "learn data analysis", "learn UI UX design", "learn digital marketing", "learn frontend development", "learn backend development", "learn Python", "learn JavaScript", "learn Next.js", "learn React", "learn content creation", "learn entrepreneurship", "learn finance", "learn project management", "become a developer", "become a software engineer", "become a data analyst", "become a UI designer", "become a digital marketer", "become a social media manager", "career change", "break into tech", "tech skills Nigeria", "remote work skills", "freelance skills", "gamified learning", "learning certificates", "quiz based learning", "learning streaks", "XP learning system", "offline learning", "progressive web app learning", "mobile learning app", "AI generated lessons", "personalised curriculum", "Cognara", "cognaralearn", "cognaralearn com", "CreedTech"
  ],
  authors: [{ name: "Cognara Team", url: "https://www.cognaralearn.com" }],
  publisher: 'Cognara',
  creator: "Creed Tech",

  alternates: {
    canonical: 'https://www.cognaralearn.com',
  },
  openGraph: {
    title: 'Cognara — Your goal. Your roadmap. Your AI mentor.',
    description: 'Whatever you want to achieve, Cognara builds your personalised learning path, teaches you at your exact level, and keeps you accountable every single day.',
    url: "https://www.cognaralearn.com",
    siteName: "Cognara",
    images: [
      {
        url: "https://www.cognaralearn.com/cognara-logo.png",
        width: 1200,
        height: 675,
        alt: "Cognara — AI Achievement System",
      }
    ],
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: 'Cognara — Your goal. Your roadmap. Your AI mentor.',
    description: 'Whatever you want to achieve, Cognara builds your personalised learning path, teaches you at your exact level, and keeps you accountable every single day.',
    images: ["https://www.cognaralearn.com/cognara-logo.png"],
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

import { SplashScreen } from "@/components/ui/SplashScreen";

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
        {/* Suppress iOS default splash */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
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
          <QueryProvider>
            <SplashScreen />
            {children}
          </QueryProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
