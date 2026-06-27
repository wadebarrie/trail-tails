import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "PackRoute — Dog hike operations, simplified",
    template: "%s · PackRoute",
  },
  description:
    "Schedules, SMS updates, and a simple driver app for dog hiking companies. Keep customers informed without the text thread chaos.",
  openGraph: {
    title: "PackRoute — Dog hike operations, simplified",
    description:
      "Schedules, SMS updates, and a simple driver app for dog hiking companies.",
    siteName: "PackRoute",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b4332",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
