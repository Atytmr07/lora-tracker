"use client";

import { Purchase } from "@/lib/types";
import { useCurrency } from "@/lib/currency-context";

interface HeroSectionProps {
  purchases: Purchase[];
  btcPrice: number | null;
}

export default function HeroSection({ purchases, btcPrice }: HeroSectionProps) {
  const { fmt, isTRY, tryRate } = useCurrency();

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
      padding: "36px 40px",
      marginBottom: 24,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Watermark ₿ */}
      <div style={{
        position: "absolute", right: -10, top: "50%", transform: "translateY(-50%)",
        fontSize: 260, fontWeight: 900, color: "rgba(247,147,26,0.03)",
        lineHeight: 1, userSelect: "none", pointerEvents: "none",
        letterSpacing: "-0.05em",
      }}>₿</div>

      {/* Orange top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #F7931A 0%, rgba(247,147,26,0.2) 100%)", borderRadius: "12px 12px 0 0" }} />

      {/* Label */}
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 12 }}>
        Total Bitcoin Holdings
      </p>

      {/* Big BTC number */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 56, fontWeight: 800, color: "#F7931A", letterSpacing: "-0.04em", lineHeight: 1 }}>
          ₿{totalBtc.toFixed(4)}
        </span>
        {btcPrice !== null && (
          <span style={{ fontSize: 22, fontWeight: 600, color: "#fff", letterSpacing: "-0.02em" }}>
            {fmt(currentValueUsd ?? 0)}
          </span>
        )}
        {pnlUsd !== null && (
          <span style={{
            fontSize: 15, fontWeight: 600, color: pnlColor,
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
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <StatItem label="Avg Cost" value={avgBuyUsd > 0 ? fmt(avgBuyUsd) : "—"} />
        {statSep}
        <StatItem
          label="Total Invested"
          value={fmt(totalInvestedUsd)}
          sub={isTRY ? `$${Math.round(totalInvestedUsd).toLocaleString()} USD` : undefined}
        />
        {statSep}
        <StatItem
          label="P&L"
          value={pnlUsd === null ? "—" : (pnlUp ? "+" : "") + fmt(pnlUsd)}
          valueColor={pnlColor}
        />
        {statSep}
        <StatItem label="Purchases" value={String(purchases.length)} />

        <span style={{ marginLeft: "auto", fontSize: 12, color: "#374151" }}>
          As of {today}
        </span>
      </div>
    </div>
  );
}

function StatItem({ label, value, sub, valueColor }: { label: string; value: string; sub?: string; valueColor?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4b5563" }}>
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: valueColor || "#e2e8f0", letterSpacing: "-0.02em" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 10, color: "#374151" }}>{sub}</span>}
    </div>
  );
}
