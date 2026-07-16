import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "../static/css/style.css";
import { Providers } from "./providers";
import MobileBottomNav from "../components/MobileBottomNav";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const metadata = {
  title: "Spendly — Track Smarter. Spend Wiser.",
  description: "Minimalist, privacy-first personal expense tracker. Scan receipts, forecast monthly burn, track subscriptions, and visualize cash flow securely.",
  icons: {
    icon: '/images/favicon.svg',
    apple: '/images/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <body suppressHydrationWarning className="font-sans antialiased min-h-screen">
        <Providers>
          {children}
          <MobileBottomNav />
        </Providers>
      </body>
    </html>
  );
}
