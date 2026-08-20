import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { ThemeProvider } from "@/components/shared/theme-provider";
import { themeInitScript } from "@/components/shared/theme-script";

import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "D&A — Dreams & Anime Shop",
    template: "%s · D&A",
  },
  description: "D&A (Dreams & Anime) — anime merch, figures, manga and cosplay shop.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" suppressHydrationWarning className={`${nunito.variable} ${fredoka.variable}`}>
      <head>
        {/* Inline FOUC guard — avoid next/script (client) which trips React 19 script warnings */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
