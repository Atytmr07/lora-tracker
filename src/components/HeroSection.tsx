"use client";

import { Purchase } from "@/lib/types";
import { useCurrency } from "@/lib/currency-context";
import { useIsMobile } from "@/lib/use-mobile";

interface HeroSectionProps {
  purchases: Purchase[];
  btcPrice: number | null;
}

export default function HeroSection({ purchases, btcPrice }: HeroSectionProps) {
  const { fmt, isTRY, tryRate } = useCurrency();
  const isMobile = useIsMobile();

  const totalBtc = purchases.reduce((s, p) => s + p.btc, 0);
  const totalInvestedUsd = purchases.reduce((s, p) => s + p.btc * p.price, 0);
  const currentValueUsd = btcPrice !== null ? totalBtc * btcPrice : null;
  const pnlUsd = currentValueUsd !== null ? currentValueUsd - totalInvestedUsd : null;
  const returnPct = totalInvestedUsd > 0 && pnlUsd !== null ? (pnlUsd / totalInvestedUsd) * 100 : null;
  const avgBuyUsd = totalBtc > 0 ? totalInvestedUsd / totalBtc : 0;

  const pnlUp = pnlUsd !== null && pnlUsd >= 0;
  const pnlColor = pnlUsd === null ? "#6b7280" : pnlUp ? "#10b981" : "#ef4444";

  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const statSep = (
    <span style={{ color: "#1a1a2e", fontSize: 18, userSelect: "none" }}>|</span>
  );

  return (
    <div style={{
      backgroundColor: "#0e0e1a",
      border: "1px solid #1a1a2e",
      borderRadius: 12,
      padding: isMobile ? "22px 18px" : "36px 40px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Watermark ₿ */}
      <div style={{
        position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
        fontSize: isMobile ? 140 : 260, fontWeight: 900, color: "rgba(247,147,26,0.03)",
        lineHeight: 1, userSelect: "none", pointerEvents: "none",
        letterSpacing: "-0.05em",
      }}>₿</div>

      {/* Orange top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #F7931A 0%, rgba(247,147,26,0.2) 100%)", borderRadius: "12px 12px 0 0" }} />

      {/* Label */}
      <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 10 }}>
        Total Bitcoin Holdings
      </p>

      {/* Big BTC number */}
      <div style={{ display: "flex", alignItems: "baseline", gap: isMobile ? 8 : 10, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: isMobile ? 38 : 56, fontWeight: 800, color: "#F7931A", letterSpacing: "-0.04em", lineHeight: 1 }}>
          ₿{totalBtc.toFixed(4)}
        </span>
        {btcPrice !== null && (
          <span style={{ fontSize: isMobile ? 17 : 22, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
            {fmt(currentValueUsd ?? 0)}
          </span>
        )}
        {pnlUsd !== null && (
          <span style={{
            fontSize: isMobile ? 13 : 15, fontWeight: 600, color: pnlColor,
            display: "flex", alignItems: "center", gap: 3,
          }}>
            {pnlUp ? "▲" : "▼"}
            {returnPct !== null && Math.abs(returnPct).toFixed(2) + "%"}
            <span style={{ color: "#4b5563", fontWeight: 400 }}>
              ({pnlUp ? "+" : ""}{fmt(pnlUsd)})
            </span>
          </span>
        )}
      </div>

      {/* Secondary stats row */}
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 12 : 20, flexWrap: "wrap" }}>
        <StatItem label="Avg Cost" value={avgBuyUsd > 0 ? fmt(avgBuyUsd) : "—"} isMobile={isMobile} />
        {!isMobile && statSep}
        <StatItem
          label="Invested"
          value={fmt(totalInvestedUsd)}
          sub={isTRY ? `$${Math.round(totalInvestedUsd).toLocaleString()} USD` : undefined}
          isMobile={isMobile}
        />
        {!isMobile && statSep}
        <StatItem
          label="P&L"
          value={pnlUsd === null ? "—" : (pnlUp ? "+" : "") + fmt(pnlUsd)}
          valueColor={pnlColor}
          isMobile={isMobile}
        />
        {!isMobile && statSep}
        <StatItem label="Buys" value={String(purchases.length)} isMobile={isMobile} />

        {!isMobile && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#374151" }}>
            As of {today}
          </span>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value, sub, valueColor, isMobile }: {
  label: string; value: string; sub?: string; valueColor?: string; isMobile?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4b5563" }}>
        {label}
      </span>
      <span style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, color: valueColor || "#e2e8f0", letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 10, color: "#374151" }}>{sub}</span>}
    </div>
  );
}
