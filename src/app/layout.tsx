import type { Metadata } from "next";
import "./globals.css";
import { CurrencyProvider } from "@/lib/currency-context";

export const metadata: Metadata = {
  title: "LoraTracker — Personal Bitcoin Portfolio",
  description: "Track your personal Bitcoin purchases and portfolio performance with real-time prices, charts, and DCA analysis.",
  openGraph: {
    title: "LoraTracker — Personal Bitcoin Portfolio",
    description: "Track your personal Bitcoin purchases and portfolio performance with real-time prices, charts, and DCA analysis.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "LoraTracker — Personal Bitcoin Portfolio",
    description: "Track your personal Bitcoin purchases and portfolio performance.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body
        className="min-h-full flex flex-col"
        style={{ backgroundColor: "#0a0a0f", color: "#fff" }}
      >
        <CurrencyProvider>{children}</CurrencyProvider>
      </body>
    </html>
  );
}
