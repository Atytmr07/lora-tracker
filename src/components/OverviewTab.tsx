"use client";

import MetricCard from "./MetricCard";
import HeroSection from "./HeroSection";
import { Purchase } from "@/lib/types";
import { useCurrency } from "@/lib/currency-context";
import { useIsMobile } from "@/lib/use-mobile";

interface OverviewTabProps {
  purchases: Purchase[];
  btcPrice: number | null;
  historicalPrices: [number, number][];
  btcDominance?: number | null;
  totalMcapT?: number | null;
}

export default function OverviewTab({ purchases, btcPrice, historicalPrices, btcDominance, totalMcapT }: OverviewTabProps) {
  const { fmt, isTRY, tryRate } = useCurrency();
  const isMobile = useIsMobile();

  const totalBtc        = purchases.reduce((s, p) => s + p.btc, 0);
  const totalInvestedUsd = purchases.reduce((s, p) => s + p.btc * p.price, 0);
  const currentValueUsd  = btcPrice !== null ? totalBtc * btcPrice : null;
  const pnlUsd           = currentValueUsd !== null ? currentValueUsd - totalInvestedUsd : null;
  const returnPct        = totalInvestedUsd > 0 && pnlUsd !== null ? (pnlUsd / totalInvestedUsd) * 100 : null;
  const avgBuyUsd        = totalBtc > 0 ? totalInvestedUsd / totalBtc : 0;

  const pnlColor = pnlUsd === null ? "#fff" : pnlUsd >= 0 ? "#10b981" : "#ef4444";
  const pnlStr   = pnlUsd === null ? "—" : (pnlUsd >= 0 ? "+" : "") + fmt(pnlUsd);
  const retStr   = returnPct === null ? "—" : (returnPct >= 0 ? "+" : "") + returnPct.toFixed(2) + "%";

  // Analysis metrics
  const sorted    = [...purchases].sort((a, b) => a.date.localeCompare(b.date));
  const firstDate = sorted[0]?.date;
  const lastDate  = sorted[sorted.length - 1]?.date;

  const daysHolding = firstDate
    ? Math.floor((Date.now() - new Date(firstDate + "T00:00:00").getTime()) / 86_400_000)
    : null;

  const totalSats = Math.round(totalBtc * 1e8);

  const purchaseReturns = btcPrice !== null
    ? purchases.map(p => ({ ...p, ret: ((btcPrice - p.price) / p.price) * 100 }))
    : [];
  const best  = purchaseReturns.length ? purchaseReturns.reduce((a, b) => b.ret > a.ret ? b : a) : null;
  const worst = purchaseReturns.length ? purchaseReturns.reduce((a, b) => b.ret < a.ret ? b : a) : null;

  const breakEven = btcPrice !== null && avgBuyUsd > 0
    ? ((btcPrice - avgBuyUsd) / btcPrice) * 100
    : null;

  const breakEvenPrice = avgBuyUsd > 0 ? avgBuyUsd : null;

  // BTC yield: sats per USD invested
  const satsPerUsd = totalInvestedUsd > 0 ? (totalSats / totalInvestedUsd).toFixed(2) : null;

  let daysInProfit = 0, totalDays = 0;
  if (firstDate && historicalPrices.length && avgBuyUsd > 0) {
    const firstTs = new Date(firstDate + "T00:00:00").getTime();
    for (const [ts, p] of historicalPrices) {
      if (ts >= firstTs) { totalDays++; if (p > avgBuyUsd) daysInProfit++; }
    }
  }
  const profitDaysPct = totalDays > 0 ? (daysInProfit / totalDays) * 100 : null;

  // Avg days between buys
  let avgIntervalDays: number | null = null;
  if (sorted.length >= 2) {
    const spans: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const a = new Date(sorted[i - 1].date + "T00:00:00").getTime();
      const b = new Date(sorted[i].date + "T00:00:00").getTime();
      spans.push((b - a) / 86_400_000);
    }
    avgIntervalDays = Math.round(spans.reduce((s, v) => s + v, 0) / spans.length);
  }

  // Largest buy
  const largestBuy = purchases.length
    ? purchases.reduce((a, b) => b.btc * b.price > a.btc * a.price ? b : a)
    : null;

  // Deepest HODL — purchase held the longest
  const deepestHodl = sorted[0] ?? null;
  const deepestDays = deepestHodl
    ? Math.floor((Date.now() - new Date(deepestHodl.date + "T00:00:00").getTime()) / 86_400_000)
    : null;

  const SectionLabel = ({ children }: { children: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8, marginBottom: 16 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", flexShrink: 0 }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, backgroundColor: "#1a1a2e" }} />
    </div>
  );

  return (
    <div>
      <HeroSection purchases={purchases} btcPrice={btcPrice} />

      {/* ── Market Context ── */}
      {(btcDominance !== null || totalMcapT !== null) && (
        <>
          <SectionLabel>Market</SectionLabel>
          <div style={{
            display: "flex", gap: isMobile ? 10 : 14, marginBottom: 28, flexWrap: "wrap",
          }}>
            {btcDominance !== null && (
              <DominanceCard dominance={btcDominance} isMobile={isMobile} />
            )}
            {totalMcapT !== null && (
              <div style={{
                backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
                borderRadius: 10, padding: isMobile ? "14px 16px" : "18px 22px",
                flex: isMobile ? "1 1 140px" : "0 0 auto", minWidth: 140,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: 2, backgroundColor: "#6b7280", opacity: 0.4 }} />
                <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 6 }}>
                  Total Market Cap
                </div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#e2e8f0", letterSpacing: "-0.03em" }}>
                  ${totalMcapT.toFixed(2)}T
                </div>
                <div style={{ fontSize: 10, color: "#374151", marginTop: 3 }}>USD</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 8 Metric cards in 4×2 grid ── */}
      <SectionLabel>Portfolio Metrics</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 32 }}>
        <MetricCard
          label="Total BTC"
          value={`₿ ${totalBtc.toFixed(4)}`}
          sub={`${purchases.length} purchase${purchases.length !== 1 ? "s" : ""}`}
          accent="#F7931A"
        />
        <MetricCard
          label="Total Invested"
          value={fmt(totalInvestedUsd)}
          sub={isTRY ? `$${Math.round(totalInvestedUsd).toLocaleString()} · Rate ₺${tryRate.toFixed(1)}` : "Cost basis"}
          accent="#F7931A"
        />
        <MetricCard
          label="Current Value"
          value={currentValueUsd !== null ? fmt(currentValueUsd) : "—"}
          sub={btcPrice !== null
            ? isTRY
              ? `BTC = ₺${Math.round(btcPrice * tryRate).toLocaleString("tr-TR")}`
              : `@ $${btcPrice.toLocaleString("en-US")} / BTC`
            : "Loading price…"}
          accent="#F7931A"
        />
        <MetricCard
          label="Avg Buy Price"
          value={avgBuyUsd > 0 ? fmt(avgBuyUsd) : "—"}
          sub={isTRY ? `$${Math.round(avgBuyUsd).toLocaleString()} USD basis` : "weighted average"}
          accent="#F7931A"
        />
        <MetricCard
          label="Unrealized P&L"
          value={pnlStr}
          valueColor={pnlColor}
          sub="vs. total invested"
        />
        <MetricCard
          label="Total Return"
          value={retStr}
          valueColor={pnlColor}
          sub="since first purchase"
        />
        <MetricCard
          label="Break-even Price"
          value={breakEvenPrice !== null ? fmt(breakEvenPrice) : "—"}
          valueColor={breakEven !== null ? (breakEven >= 0 ? "#10b981" : "#ef4444") : "#fff"}
          sub={breakEven !== null
            ? breakEven >= 0
              ? `${breakEven.toFixed(1)}% above cost`
              : `Need +${Math.abs(breakEven).toFixed(1)}% to break even`
            : "—"}
          accent={breakEven !== null && breakEven >= 0 ? "#10b981" : "#ef4444"}
        />
        <MetricCard
          label="Sats / USD"
          value={satsPerUsd !== null ? satsPerUsd : "—"}
          sub={`${totalSats.toLocaleString()} sats total`}
          accent="#F7931A"
        />
      </div>

      {/* ── DCA Analysis card ── */}
      {purchases.length > 0 && (
        <>
          <SectionLabel>DCA Analysis</SectionLabel>
          <div style={{
            backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
            borderRadius: 10, padding: isMobile ? "16px 14px" : "20px 24px", marginBottom: 32,
          }}>
            {/* Row 1: Timeline */}
            <div style={{
              display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: isMobile ? 16 : 0, borderBottom: "1px solid #12121e", paddingBottom: 20, marginBottom: 20,
            }}>
              {[
                {
                  label: "First Buy",
                  value: firstDate ? new Date(firstDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
                  sub: daysHolding !== null ? `${daysHolding} days ago` : "",
                },
                {
                  label: "Last Buy",
                  value: lastDate ? new Date(lastDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—",
                  sub: sorted.length > 1 ? `${sorted.length} buys total` : "Only buy",
                },
                {
                  label: "Avg Interval",
                  value: avgIntervalDays !== null ? `${avgIntervalDays} days` : "—",
                  sub: avgIntervalDays !== null ? "between purchases" : "Need ≥2 buys",
                },
                {
                  label: "Total Transactions",
                  value: String(purchases.length),
                  sub: `${totalSats.toLocaleString()} sats`,
                },
              ].map(({ label, value, sub }) => (
                <DcaCell key={label} label={label} value={value} sub={sub} />
              ))}
            </div>

            {/* Row 2: Performance */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 16 : 0 }}>
              {[
                {
                  label: "Best Buy",
                  value: best ? (best.ret >= 0 ? "+" : "") + best.ret.toFixed(1) + "%" : "—",
                  sub: best ? `${best.date} · ₿${best.btc}` : "",
                  color: "#10b981",
                },
                {
                  label: "Worst Buy",
                  value: worst ? (worst.ret >= 0 ? "+" : "") + worst.ret.toFixed(1) + "%" : "—",
                  sub: worst ? `${worst.date} · ₿${worst.btc}` : "",
                  color: worst ? (worst.ret >= 0 ? "#10b981" : "#ef4444") : "#fff",
                },
                {
                  label: "Largest Buy",
                  value: largestBuy ? fmt(largestBuy.btc * largestBuy.price) : "—",
                  sub: largestBuy ? `₿${largestBuy.btc} on ${largestBuy.date}` : "",
                  color: "#F7931A",
                },
                {
                  label: "Deepest HODL",
                  value: deepestDays !== null ? `${deepestDays} days` : "—",
                  sub: deepestHodl ? `Since ${deepestHodl.date}` : "",
                  color: "#8b5cf6",
                },
              ].map(({ label, value, sub, color }) => (
                <DcaCell key={label} label={label} value={value} sub={sub} valueColor={color} />
              ))}
            </div>
          </div>

          {/* Strategy cards */}
          <SectionLabel>Strategy Analysis</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)", gap: 10 }}>
            <MetricCard
              label="Holding Period"
              value={daysHolding !== null ? `${daysHolding} days` : "—"}
              sub={firstDate ? `Since ${new Date(firstDate + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}` : "—"}
              accent="#6366f1"
            />
            <MetricCard
              label="Days in Profit"
              value={profitDaysPct !== null ? profitDaysPct.toFixed(1) + "%" : "—"}
              sub={`${daysInProfit} of ${totalDays} days above avg cost`}
              valueColor={profitDaysPct !== null ? (profitDaysPct >= 50 ? "#10b981" : "#f59e0b") : "#fff"}
            />
            <MetricCard
              label="Portfolio vs. Invested"
              value={pnlUsd !== null ? (pnlUsd >= 0 ? "+" : "") + fmt(Math.abs(pnlUsd)) : "—"}
              valueColor={pnlColor}
              sub={returnPct !== null ? `${returnPct >= 0 ? "+" : ""}${returnPct.toFixed(2)}% total return` : "—"}
              accent={pnlUsd !== null && pnlUsd >= 0 ? "#10b981" : "#ef4444"}
            />
          </div>
        </>
      )}
    </div>
  );
}

function DominanceCard({ dominance, isMobile }: { dominance: number; isMobile: boolean }) {
  // Qualitative label
  const label = dominance >= 60 ? "Bitcoin Season" : dominance >= 50 ? "BTC Favored" : dominance >= 40 ? "Mixed Market" : "Alt Season";
  const labelColor = dominance >= 55 ? "#F7931A" : dominance >= 45 ? "#f59e0b" : "#8b5cf6";
  const altPct = 100 - dominance;

  return (
    <div style={{
      backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
      borderRadius: 10, padding: isMobile ? "14px 16px" : "18px 22px",
      flex: isMobile ? "1 1 160px" : "0 0 auto", minWidth: isMobile ? 160 : 260,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "40%", height: 2, backgroundColor: "#F7931A", opacity: 0.6 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563" }}>
          BTC Dominance
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: labelColor, backgroundColor: `${labelColor}18`, borderRadius: 4, padding: "1px 7px" }}>
          {label}
        </div>
      </div>

      <div style={{ fontSize: isMobile ? 28 : 34, fontWeight: 800, color: "#F7931A", letterSpacing: "-0.04em", lineHeight: 1, marginBottom: 10 }}>
        {dominance.toFixed(1)}%
      </div>

      {/* Dominance bar */}
      <div style={{ height: 6, borderRadius: 3, backgroundColor: "#1a1a2e", overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 3,
          width: `${dominance}%`,
          background: "linear-gradient(90deg, #F7931A 0%, #e8850a 100%)",
          transition: "width 0.5s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 10, color: "#4b5563" }}>
        <span>₿ BTC {dominance.toFixed(1)}%</span>
        <span>ALT {altPct.toFixed(1)}%</span>
      </div>
    </div>
  );
}

function DcaCell({ label, value, sub, valueColor }: {
  label: string; value: string; sub?: string; valueColor?: string;
}) {
  return (
    <div style={{ padding: "0 12px 0 0" }}>
      <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: valueColor || "#e2e8f0", letterSpacing: "-0.02em", marginBottom: 3 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 10, color: "#374151" }}>{sub}</div>
      )}
    </div>
  );
}
