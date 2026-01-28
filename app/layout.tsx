import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
import ThemeBackground from "@/components/ui/ThemeBackground";
import { NavbarProvider } from "@/components/ui/NavbarContext";
import { GitHubCredit } from "@/components/ui/GitHubCredit";
import { LayoutContent } from "@/components/ui/LayoutContent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OXsuite - Professional Tools",
  description:
    "Comprehensive office suite with web analysis and productivity tools",
  icons: {
    icon: "/favicox.png",
    shortcut: "/favicox.png",
    apple: "/favicox.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicox.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Smooch+Sans:wght@100..900&family=Press+Start+2P&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            <ThemeBackground />
          </div>
          <NavbarProvider>
            <LayoutContent>{children}</LayoutContent>
            <GitHubCredit />
          </NavbarProvider>
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
