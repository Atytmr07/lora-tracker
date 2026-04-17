"use client";

import { useCurrency } from "@/lib/currency-context";

interface FooterProps {
  btcPrice: number | null;
}

export default function Footer({ btcPrice }: FooterProps) {
  const { tryRate, isTRY } = useCurrency();
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false }) + " UTC";

  return (
    <footer style={{
      borderTop: "1px solid #1a1a2e",
      backgroundColor: "#080810",
      padding: "12px 28px",
    }}>
      <div style={{
        maxWidth: 1280, margin: "0 auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 8,
      }}>
        {/* Left: data attribution */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 11, color: "#374151" }}>
            Powered by{" "}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#4b5563", textDecoration: "none", fontWeight: 600 }}
              onMouseEnter={e => (e.currentTarget.style.color = "#F7931A")}
              onMouseLeave={e => (e.currentTarget.style.color = "#4b5563")}
            >
              CoinGecko
            </a>
          </span>

          {btcPrice !== null && (
            <span style={{ fontSize: 11, color: "#374151" }}>
              BTC Price:{" "}
              <span style={{ color: "#6b7280", fontWeight: 600 }}>
                ${btcPrice.toLocaleString("en-US")}
              </span>
            </span>
          )}

          <span style={{ fontSize: 11, color: "#374151" }}>
            Last updated: <span style={{ color: "#6b7280" }}>{timeStr}</span>
          </span>

          {isTRY && tryRate > 0 && (
            <span style={{ fontSize: 11, color: "#374151" }}>
              Rate:{" "}
              <span style={{ color: "#6b7280", fontWeight: 600 }}>
                1 USD = ₺{tryRate.toFixed(2)}
              </span>
            </span>
          )}
        </div>

        {/* Right: copyright */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "#374151" }}>
            © {now.getFullYear()}{" "}
            <span style={{ color: "#4b5563", fontWeight: 600 }}>LoraTracker</span>
            {" "}· Personal Bitcoin Portfolio
          </span>
        </div>
      </div>
    </footer>
  );
}
