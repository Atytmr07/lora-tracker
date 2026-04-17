"use client";

import { useState } from "react";
import { addPurchase } from "@/lib/purchases";
import { useCurrency } from "@/lib/currency-context";

interface Props {
  onClose: () => void;
  onAdded: () => void;
  btcPrice: number | null;
}

export default function AddPurchaseModal({ onClose, onAdded, btcPrice }: Props) {
  const { isTRY, tryRate, fmt } = useCurrency();

  // Pre-fill today's date and current BTC price
  const today        = new Date().toISOString().split("T")[0];
  const initPrice    = btcPrice !== null
    ? String(isTRY ? Math.round(btcPrice * tryRate) : Math.round(btcPrice))
    : "";

  const [form, setForm]      = useState({ date: today, btc: "", price: initPrice });
  const [submitting, setSub] = useState(false);
  const [error, setError]    = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const btc = parseFloat(form.btc), price = parseFloat(form.price);
    if (!form.date || isNaN(btc) || isNaN(price) || btc <= 0 || price <= 0) {
      setError("Please fill in all fields with valid values.");
      return;
    }
    setSub(true);
    const priceUsd = isTRY ? price / tryRate : price;
    try { await addPurchase({ date: form.date, btc, price: priceUsd }); onAdded(); }
    catch { setError("Failed to save. Check Firebase connection."); }
    finally { setSub(false); }
  }

  const btcV  = parseFloat(form.btc);
  const prcV  = parseFloat(form.price);
  const ok    = !isNaN(btcV) && !isNaN(prcV) && btcV > 0 && prcV > 0;
  const usdP  = ok ? (isTRY ? prcV / tryRate : prcV) : 0;
  const total = ok ? btcV * usdP : 0;

  const I: React.CSSProperties = {
    backgroundColor: "#080810", border: "1px solid #1a1a2e", borderRadius: 6,
    padding: "10px 13px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
    outline: "none", width: "100%", transition: "border-color 0.15s",
  };
  const L = (t: string) => (
    <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#4b5563", display: "block", marginBottom: 7 }}>
      {t}
    </label>
  );

  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 100, backdropFilter: "blur(2px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        zIndex: 101, backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
        borderRadius: 12, padding: 32, width: "100%", maxWidth: 420,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 3 }}>Add Purchase</h2>
            <p style={{ fontSize: 12, color: "#4b5563" }}>Record a new Bitcoin buy</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: 22, lineHeight: 1, fontFamily: "inherit", padding: 4 }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            {L("Date")}
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              style={{ ...I, colorScheme: "dark" }} required />
          </div>

          <div>
            {L("BTC Amount")}
            <input type="number" step="0.00000001" min="0" placeholder="0.1000"
              value={form.btc}
              onChange={e => setForm(f => ({ ...f, btc: e.target.value }))}
              style={I} required />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563" }}>
                Buy Price ({isTRY ? "₺ / BTC" : "USD / BTC"})
              </label>
              {btcPrice !== null && (
                <button type="button" onClick={() =>
                  setForm(f => ({ ...f, price: String(isTRY ? Math.round(btcPrice * tryRate) : Math.round(btcPrice)) }))
                } style={{
                  background: "none", border: "1px solid #1a1a2e", borderRadius: 4,
                  padding: "2px 8px", fontSize: 10, color: "#4b5563",
                  cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#F7931A"; e.currentTarget.style.color = "#F7931A"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#4b5563"; }}
                >
                  Use live price
                </button>
              )}
            </div>
            <input type="number" step="0.01" min="0"
              value={form.price}
              onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
              style={I} required />
            {isTRY && ok && (
              <p style={{ fontSize: 11, color: "#374151", marginTop: 5 }}>
                Stored as ${usdP.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD
              </p>
            )}
          </div>

          {/* Total preview */}
          {ok && (
            <div style={{ backgroundColor: "#080810", border: "1px solid #1a1a2e", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Cost</span>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#F7931A", letterSpacing: "-0.02em" }}>{fmt(total)}</span>
                {isTRY && <div style={{ fontSize: 11, color: "#374151" }}>${total.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD</div>}
              </div>
            </div>
          )}

          {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, backgroundColor: "transparent", border: "1px solid #1a1a2e",
              borderRadius: 6, padding: "11px 0", fontSize: 14, color: "#6b7280",
              cursor: "pointer", fontFamily: "inherit",
            }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{
              flex: 2, backgroundColor: "#F7931A", color: "#fff", border: "none",
              borderRadius: 6, padding: "11px 0", fontSize: 14, fontWeight: 700,
              cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
              opacity: submitting ? 0.7 : 1, letterSpacing: "0.01em",
            }}>
              {submitting ? "Saving…" : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
