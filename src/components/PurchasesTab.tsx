"use client";

import { Purchase } from "@/lib/types";
import { deletePurchase } from "@/lib/purchases";
import { useCurrency } from "@/lib/currency-context";
import { useIsMobile } from "@/lib/use-mobile";
import { type User } from "firebase/auth";

interface Props {
  purchases: Purchase[];
  btcPrice: number | null;
  onDeleted?: () => void;
  user?: User | null;
}

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PurchasesTab({ purchases, btcPrice, onDeleted, user }: Props) {
  const { fmt, isTRY, tryRate } = useCurrency();
  const isMobile = useIsMobile();

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase?")) return;
    try { await deletePurchase(id); onDeleted?.(); }
    catch { alert("Delete failed. Firebase auth may be required."); }
  }

  const totalBtc      = purchases.reduce((s, p) => s + p.btc, 0);
  const totalCostUsd  = purchases.reduce((s, p) => s + p.btc * p.price, 0);
  const totalValueUsd = btcPrice !== null ? totalBtc * btcPrice : null;
  const totalPnlUsd   = totalValueUsd !== null ? totalValueUsd - totalCostUsd : null;
  const totalRet      = totalPnlUsd !== null && totalCostUsd > 0 ? (totalPnlUsd / totalCostUsd) * 100 : null;

  const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
    <th style={{
      padding: "11px 16px", fontSize: 10, fontWeight: 700, textTransform: "uppercase",
      letterSpacing: "0.1em", color: "#4b5563", textAlign: right ? "right" : "left",
      borderBottom: "1px solid #1a1a2e", whiteSpace: "nowrap", backgroundColor: "#080810",
    }}>{children}</th>
  );

  const TD = ({ children, right, style }: { children: React.ReactNode; right?: boolean; style?: React.CSSProperties }) => (
    <td style={{ padding: "13px 16px", fontSize: 13, color: "#e2e8f0", textAlign: right ? "right" : "left", ...style }}>
      {children}
    </td>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Summary bar */}
      {purchases.length > 0 && (
        <div style={{
          backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
          borderRadius: "10px 10px 0 0", padding: isMobile ? "12px 14px" : "14px 20px",
          display: "flex", gap: isMobile ? 16 : 32, alignItems: "center",
          borderBottom: "none", flexWrap: isMobile ? "wrap" : "nowrap",
        }}>
          {[
            { label: "Holdings", value: `₿ ${totalBtc.toFixed(4)}` },
            { label: "Invested", value: fmt(totalCostUsd) },
            { label: "Current Value", value: totalValueUsd !== null ? fmt(totalValueUsd) : "—" },
            { label: "P&L", value: totalPnlUsd !== null ? (totalPnlUsd >= 0 ? "+" : "") + fmt(totalPnlUsd) : "—", color: totalPnlUsd !== null ? (totalPnlUsd >= 0 ? "#10b981" : "#ef4444") : "#e2e8f0" },
            { label: "Return", value: totalRet !== null ? (totalRet >= 0 ? "+" : "") + totalRet.toFixed(2) + "%" : "—", color: totalRet !== null ? (totalRet >= 0 ? "#10b981" : "#ef4444") : "#e2e8f0" },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: color || "#e2e8f0", letterSpacing: "-0.02em" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{
        backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
        borderRadius: purchases.length > 0 ? "0 0 10px 10px" : 10,
        overflow: "hidden", overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 520 : undefined }}>
          <thead>
            <tr>
              {!isMobile && <TH>#</TH>}
              <TH>Date</TH>
              <TH>BTC</TH>
              <TH>Buy Price</TH>
              {!isMobile && <TH>Cost</TH>}
              {!isMobile && <TH>Value</TH>}
              <TH right>P&L</TH>
              <TH right>Return</TH>
              {user && <TH>{""}</TH>}
            </tr>
          </thead>
          <tbody>
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={user ? 9 : 8} style={{ padding: 60, textAlign: "center", color: "#374151", fontSize: 14 }}>
                  No purchases yet.{user ? <> Click <strong style={{ color: "#F7931A" }}>+ Add Purchase</strong> to get started.</> : null}
                </td>
              </tr>
            ) : purchases.map((p, i) => {
              const costUsd  = p.btc * p.price;
              const valueUsd = btcPrice !== null ? p.btc * btcPrice : null;
              const pnlUsd   = valueUsd !== null ? valueUsd - costUsd : null;
              const ret      = pnlUsd !== null && costUsd > 0 ? (pnlUsd / costUsd) * 100 : null;
              const up       = pnlUsd !== null && pnlUsd >= 0;
              const pnlColor = pnlUsd === null ? "#6b7280" : up ? "#10b981" : "#ef4444";
              const rowBg    = i % 2 === 0 ? "#0e0e1a" : "#0a0a12";
              const buyPrice = isTRY
                ? "₺" + Math.round(p.price * tryRate).toLocaleString("tr-TR")
                : "$" + p.price.toLocaleString("en-US");

              return (
                <tr key={p.id}
                  style={{ backgroundColor: rowBg, transition: "background-color 0.12s", borderTop: "1px solid #12121e" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#131323")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = rowBg)}
                >
                  {!isMobile && <TD style={{ color: "#374151", fontSize: 12 }}>{i + 1}</TD>}
                  <TD>{isMobile ? p.date.slice(2) : fmtDate(p.date)}</TD>
                  <TD style={{ color: ORANGE, fontWeight: 700 }}>₿ {p.btc.toFixed(4)}</TD>
                  <TD>{buyPrice}</TD>
                  {!isMobile && <TD>{fmt(costUsd)}</TD>}
                  {!isMobile && <TD>{valueUsd !== null ? fmt(valueUsd) : <span style={{ color: "#374151" }}>—</span>}</TD>}
                  <TD right style={{ color: pnlColor, fontWeight: 600 }}>
                    {pnlUsd === null ? <span style={{ color: "#374151" }}>—</span> : (up ? "+" : "") + fmt(pnlUsd)}
                  </TD>
                  <TD right>
                    {ret === null ? (
                      <span style={{ color: "#374151" }}>—</span>
                    ) : (
                      <span style={{
                        display: "inline-block", padding: "2px 6px", borderRadius: 4,
                        fontSize: 12, fontWeight: 700,
                        backgroundColor: up ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        color: pnlColor,
                      }}>
                        {ret >= 0 ? "+" : ""}{ret.toFixed(1)}%
                      </span>
                    )}
                  </TD>
                  {user && (
                    <TD>
                      <button onClick={() => handleDelete(p.id)} style={{
                        background: "none", border: "1px solid #1a1a2e", borderRadius: 4,
                        padding: "3px 8px", fontSize: 11, color: "#374151",
                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                      }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#374151"; }}
                      >
                        Del
                      </button>
                    </TD>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ORANGE = "#F7931A";
