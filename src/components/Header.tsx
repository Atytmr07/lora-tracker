"use client";

import { type User } from "firebase/auth";
import { useCurrency } from "@/lib/currency-context";
import { useIsMobile } from "@/lib/use-mobile";

type Tab = "overview" | "charts" | "purchases";

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  btcPrice: number | null;
  btcChange24h: number | null;
  totalReturn: number | null;
  btcDominance?: number | null;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onAddPurchase: () => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview"  },
  { id: "charts",    label: "Charts"    },
  { id: "purchases", label: "Purchases" },
];

export default function Header({
  activeTab, onTabChange, btcPrice, btcChange24h, totalReturn, btcDominance,
  user, onSignIn, onSignOut, onAddPurchase,
}: HeaderProps) {
  const { isTRY, toggle, tryRate } = useCurrency();
  const isMobile = useIsMobile();

  const displayPrice = btcPrice !== null
    ? isTRY
      ? "₺" + Math.round(btcPrice * tryRate).toLocaleString("tr-TR")
      : "$" + btcPrice.toLocaleString("en-US")
    : "—";

  const changeUp  = btcChange24h !== null && btcChange24h >= 0;
  const changeClr = btcChange24h === null ? "#6b7280" : changeUp ? "#10b981" : "#ef4444";
  const retUp     = totalReturn !== null && totalReturn >= 0;
  const retClr    = totalReturn === null ? "#6b7280" : retUp ? "#10b981" : "#ef4444";

  /* ── Mobile layout ─────────────────────────────────────────── */
  if (isMobile) {
    return (
      <header style={{ backgroundColor: "#0a0a0f", borderBottom: "1px solid #1a1a2e", position: "sticky", top: 0, zIndex: 50 }}>

        {/* Row 1: logo + price pill + auth */}
        <div style={{ padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 10 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              background: "linear-gradient(135deg, #F7931A 0%, #e8850a 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 13, color: "#fff",
            }}>₿</div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
              Lora<span style={{ color: "#F7931A" }}>Tracker</span>
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Currency toggle */}
          <div style={{ display: "flex", gap: 1, backgroundColor: "#111118", border: "1px solid #1a1a2e", borderRadius: 6, padding: 2 }}>
            {(["USD", "TRY"] as const).map((cur) => {
              const active = (cur === "TRY") === isTRY;
              return (
                <button key={cur} onClick={toggle} style={{
                  padding: "2px 7px", borderRadius: 4, border: "none", cursor: "pointer",
                  fontSize: 10, fontWeight: 600, fontFamily: "inherit",
                  transition: "all 0.15s",
                  backgroundColor: active ? "#F7931A" : "transparent",
                  color: active ? "#fff" : "#4b5563",
                }}>{cur}</button>
              );
            })}
          </div>

          {/* BTC price compact */}
          <div style={{
            display: "flex", alignItems: "center", gap: 5,
            backgroundColor: "#111118", border: "1px solid #1a1a2e",
            borderRadius: 16, padding: "4px 10px",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block", animation: "hb 2s infinite" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{displayPrice}</span>
            {btcChange24h !== null && (
              <span style={{ fontSize: 10, fontWeight: 700, color: changeClr }}>
                {changeUp ? "▲" : "▼"}{Math.abs(btcChange24h).toFixed(1)}%
              </span>
            )}
          </div>

          {/* Auth */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                backgroundColor: "rgba(247,147,26,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#F7931A", flexShrink: 0,
              }}>
                {user.email?.[0].toUpperCase() ?? "A"}
              </div>
              {/* Add purchase */}
              <button onClick={onAddPurchase} style={{
                backgroundColor: "#F7931A", color: "#fff", border: "none", borderRadius: 6,
                padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 3,
              }}>
                <span style={{ fontSize: 15, lineHeight: 1, fontWeight: 400 }}>+</span>
                Add
              </button>
              {/* Sign out */}
              <button onClick={onSignOut} style={{
                background: "none", border: "1px solid #1a1a2e", borderRadius: 6,
                padding: "5px 8px", fontSize: 11, color: "#6b7280",
                cursor: "pointer", fontFamily: "inherit",
              }}>
                Out
              </button>
            </div>
          ) : (
            <button onClick={onSignIn} style={{
              backgroundColor: "transparent", color: "#F7931A",
              border: "1px solid rgba(247,147,26,0.4)", borderRadius: 6,
              padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit",
            }}>
              Sign In
            </button>
          )}
        </div>

        {/* Row 2: Nav tabs */}
        <div style={{ display: "flex", borderTop: "1px solid #0f0f1a" }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 700 : 400, fontFamily: "inherit",
                backgroundColor: "transparent",
                color: active ? "#F7931A" : "#6b7280",
                borderBottom: active ? "2px solid #F7931A" : "2px solid transparent",
                transition: "all 0.15s",
              }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Portfolio return + dominance strip */}
        {(totalReturn !== null || btcDominance !== null) && (
          <div style={{
            borderTop: "1px solid #0f0f1a",
            backgroundColor: "#080810",
            padding: "5px 16px",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            {totalReturn !== null && (
              <>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em" }}>Portfolio</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: retClr }}>
                  {retUp ? "+" : ""}{totalReturn.toFixed(1)}%
                </span>
              </>
            )}
            {totalReturn !== null && btcDominance !== null && (
              <span style={{ color: "#1a1a2e" }}>·</span>
            )}
            {btcDominance !== null && (
              <>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em" }}>BTC Dom</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#F7931A" }}>
                  {btcDominance.toFixed(1)}%
                </span>
              </>
            )}
          </div>
        )}

        <style>{`
          @keyframes hb { 0%,100%{opacity:1} 50%{opacity:0.35} }
          header button:focus { outline: none; }
        `}</style>
      </header>
    );
  }

  /* ── Desktop layout ─────────────────────────────────────────── */
  return (
    <header style={{ backgroundColor: "#0a0a0f", borderBottom: "1px solid #1a1a2e", position: "sticky", top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 28px", height: 60, display: "flex", alignItems: "center", gap: 24 }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "linear-gradient(135deg, #F7931A 0%, #e8850a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 15, color: "#fff",
          }}>₿</div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em", color: "#fff" }}>
            Lora<span style={{ color: "#F7931A" }}>Tracker</span>
          </span>
        </div>

        {/* Nav tabs */}
        <nav style={{ display: "flex", gap: 2, flex: 1 }}>
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{
                padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: "inherit",
                letterSpacing: "0.01em", transition: "all 0.15s",
                backgroundColor: active ? "rgba(247,147,26,0.12)" : "transparent",
                color: active ? "#F7931A" : "#6b7280",
                position: "relative" as const,
              }}>
                {tab.label}
                {active && (
                  <span style={{
                    position: "absolute", bottom: -1, left: "50%", transform: "translateX(-50%)",
                    width: 20, height: 2, backgroundColor: "#F7931A", borderRadius: 2,
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

          {/* USD / TRY toggle */}
          <div style={{ display: "flex", gap: 1, backgroundColor: "#111118", border: "1px solid #1a1a2e", borderRadius: 6, padding: 2 }}>
            {(["USD", "TRY"] as const).map((cur) => {
              const active = (cur === "TRY") === isTRY;
              return (
                <button key={cur} onClick={toggle} style={{
                  padding: "3px 10px", borderRadius: 4, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, fontFamily: "inherit", letterSpacing: "0.05em",
                  transition: "all 0.15s",
                  backgroundColor: active ? "#F7931A" : "transparent",
                  color: active ? "#fff" : "#4b5563",
                }}>{cur}</button>
              );
            })}
          </div>

          {/* Live BTC price + 24h change */}
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            backgroundColor: "#111118", border: "1px solid #1a1a2e",
            borderRadius: 20, padding: "5px 14px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981", display: "inline-block", animation: "hb 2s infinite" }} />
            <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>BTC</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{displayPrice}</span>
            {btcChange24h !== null && (
              <span style={{
                fontSize: 11, fontWeight: 700, color: changeClr,
                backgroundColor: changeUp ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                borderRadius: 4, padding: "1px 6px",
              }}>
                {changeUp ? "▲" : "▼"} {Math.abs(btcChange24h).toFixed(2)}%
              </span>
            )}
          </div>

          {/* Portfolio total return badge */}
          {totalReturn !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: "#111118",
              border: `1px solid ${retUp ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
              borderRadius: 20, padding: "5px 12px",
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em" }}>Portfolio</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: retClr }}>
                {retUp ? "+" : ""}{totalReturn.toFixed(1)}%
              </span>
            </div>
          )}

          {/* BTC Dominance badge */}
          {btcDominance !== null && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              backgroundColor: "#111118", border: "1px solid rgba(247,147,26,0.2)",
              borderRadius: 20, padding: "5px 12px",
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#F7931A", opacity: 0.7 }}>₿</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.06em" }}>Dom</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F7931A" }}>
                {btcDominance.toFixed(1)}%
              </span>
            </div>
          )}

          {/* Auth controls */}
          {user ? (
            <>
              <div style={{
                display: "flex", alignItems: "center", gap: 7,
                backgroundColor: "#111118", border: "1px solid #1a1a2e",
                borderRadius: 20, padding: "5px 12px",
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  backgroundColor: "rgba(247,147,26,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, color: "#F7931A",
                }}>
                  {user.email?.[0].toUpperCase() ?? "A"}
                </div>
                <span style={{ fontSize: 12, color: "#6b7280", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>
              </div>

              <button onClick={onSignOut} style={{
                background: "none", border: "1px solid #1a1a2e", borderRadius: 6,
                padding: "6px 12px", fontSize: 12, color: "#6b7280",
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#6b7280"; }}
              >
                Sign out
              </button>

              <button onClick={onAddPurchase} style={{
                backgroundColor: "#F7931A", color: "#fff", border: "none", borderRadius: 6,
                padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5,
                letterSpacing: "0.01em", transition: "opacity 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                <span style={{ fontSize: 16, lineHeight: 1, fontWeight: 400 }}>+</span>
                Add Purchase
              </button>
            </>
          ) : (
            <button onClick={onSignIn} style={{
              backgroundColor: "transparent", color: "#F7931A",
              border: "1px solid rgba(247,147,26,0.4)", borderRadius: 6,
              padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", letterSpacing: "0.01em", transition: "all 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(247,147,26,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Slogan bar */}
      <div style={{
        borderTop: "1px solid #0f0f1a",
        background: "linear-gradient(90deg, transparent 0%, rgba(247,147,26,0.04) 50%, transparent 100%)",
        padding: "5px 28px",
        textAlign: "center",
      }}>
        <span style={{ fontSize: 12, color: "#6b6b8a", letterSpacing: "0.15em", fontStyle: "italic", userSelect: "none" }}>
          "There is no second best."
        </span>
        <span style={{ fontSize: 11, color: "#F7931A", opacity: 0.55, letterSpacing: "0.12em", marginLeft: 12, fontWeight: 700, textTransform: "uppercase" }}>
          — Michael Saylor
        </span>
      </div>

      <style>{`
        @keyframes hb { 0%,100%{opacity:1} 50%{opacity:0.35} }
        header button:focus { outline: none; }
      `}</style>
    </header>
  );
}
