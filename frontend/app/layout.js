import { Inter, Fragment_Mono } from "next/font/google";
import "./globals.css";
import "../static/css/tailwind.css";
import "../static/css/style.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fragmentMono = Fragment_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Spendly — Track Smarter. Spend Wiser.",
  description: "Minimalist, privacy-first personal expense tracker designed to sync with your financial ledger.",
  icons: {
    icon: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fragmentMono.variable}`}>
      <body suppressHydrationWarning className="bg-canvas dark:bg-dark-bg text-slate-700 dark:text-dark-text font-sans antialiased min-h-screen pb-20 md:pb-0 transition-colors duration-200 bg-grid-pattern">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
