import { Inter, Fragment_Mono } from "next/font/google";
import "./globals.css";
import "../static/css/tailwind.css";
import "../static/css/style.css";
import { Providers } from "./providers";
import MobileBottomNav from "../components/MobileBottomNav";

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
  openGraph: {
    title: "Spendly — Personal Ledger Terminal",
    description: "Scan receipts, forecast monthly burn, track subscriptions, and visualize cash flow securely.",
    url: "https://your-app.vercel.app",
    siteName: "Spendly",
    images: [
      {
        url: "/images/spendly_hero_dashboard.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spendly — Personal Ledger Terminal",
    images: ["/images/spendly_hero_dashboard.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fragmentMono.variable}`}>
      <body suppressHydrationWarning className="bg-canvas dark:bg-dark-bg text-slate-700 dark:text-dark-text font-sans antialiased min-h-screen pb-20 md:pb-0 transition-colors duration-200 bg-grid-pattern">
        <Providers>
          {children}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
