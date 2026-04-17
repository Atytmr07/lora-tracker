"use client";

import { useState, useEffect, useCallback } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getPurchases, addPurchase, deletePurchase } from "@/lib/purchases";
import { Purchase } from "@/lib/types";

const ORANGE = "#F7931A";

function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const I: React.CSSProperties = {
  backgroundColor: "#080810", border: "1px solid #1a1a2e", borderRadius: 6,
  padding: "9px 12px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
  outline: "none", width: "100%",
};
const L = (t: string) => (
  <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.1em", color: "#4b5563", display: "block", marginBottom: 6 }}>
    {t}
  </label>
);

// ── Login screen ─────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch {
      setError("Invalid credentials. Check email / password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
        borderRadius: 12, padding: 36, width: "100%", maxWidth: 380,
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "linear-gradient(135deg, #F7931A 0%, #e8850a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 16, color: "#fff",
          }}>₿</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>LoraTracker Admin</h1>
            <p style={{ fontSize: 12, color: "#4b5563" }}>Sign in to manage purchases</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            {L("Email")}
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={I} required />
          </div>
          <div>
            {L("Password")}
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={I} required />
          </div>
          {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{
            backgroundColor: ORANGE, color: "#fff", border: "none", borderRadius: 6,
            padding: "11px 0", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <a href="/" style={{ fontSize: 12, color: "#374151", textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#6b7280")}
            onMouseLeave={e => (e.currentTarget.style.color = "#374151")}
          >
            ← Back to portfolio
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Admin dashboard ───────────────────────────────────────────────────
function AdminDashboard({ user }: { user: User }) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState({ date: "", btc: "", price: "" });
  const [submitting, setSub]      = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPurchases(await getPurchases()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setFormError(""); setFormSuccess(false);
    const btc = parseFloat(form.btc), price = parseFloat(form.price);
    if (!form.date || isNaN(btc) || isNaN(price) || btc <= 0 || price <= 0) {
      setFormError("Fill in all fields with valid values.");
      return;
    }
    setSub(true);
    try {
      await addPurchase({ date: form.date, btc, price });
      setForm({ date: "", btc: "", price: "" });
      setFormSuccess(true);
      await load();
      setTimeout(() => setFormSuccess(false), 3000);
    } catch { setFormError("Save failed. Check Firebase auth."); }
    finally { setSub(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this purchase?")) return;
    try { await deletePurchase(id); await load(); }
    catch { alert("Delete failed."); }
  }

  const totalBtc  = purchases.reduce((s, p) => s + p.btc, 0);
  const totalCost = purchases.reduce((s, p) => s + p.btc * p.price, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#0a0a0f", borderBottom: "1px solid #1a1a2e", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "linear-gradient(135deg, #F7931A 0%, #e8850a 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#fff",
          }}>₿</div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.03em" }}>
            Lora<span style={{ color: ORANGE }}>Tracker</span>
            <span style={{ fontSize: 11, color: "#374151", marginLeft: 8, fontWeight: 500 }}>Admin</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 12, color: "#374151" }}>{user.email}</span>
          <button onClick={() => signOut(auth)} style={{
            background: "none", border: "1px solid #1a1a2e", borderRadius: 5,
            padding: "5px 12px", fontSize: 12, color: "#6b7280",
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#6b7280"; }}
          >
            Sign out
          </button>
          <a href="/" style={{
            background: ORANGE, color: "#fff", borderRadius: 5,
            padding: "5px 12px", fontSize: 12, fontWeight: 600,
            textDecoration: "none", transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            View Portfolio →
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 28px 64px", display: "flex", flexDirection: "column", gap: 28 }}>

        {/* Stats bar */}
        <div style={{
          backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e", borderRadius: 10,
          padding: "16px 24px", display: "flex", gap: 36, alignItems: "center",
        }}>
          {[
            { label: "Total Purchases", value: String(purchases.length) },
            { label: "Total BTC", value: `₿ ${totalBtc.toFixed(4)}` },
            { label: "Total Cost (USD)", value: "$" + Math.round(totalCost).toLocaleString("en-US") },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0", letterSpacing: "-0.02em" }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 24, alignItems: "start" }}>

          {/* Add purchase form */}
          <div style={{ backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: "24px" }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", marginBottom: 20 }}>
              Add Purchase
            </h2>
            <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                {L("Buy Price (USD / BTC)")}
                <input type="number" step="0.01" min="0" placeholder="95000"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  style={I} required />
              </div>

              {form.btc && form.price && !isNaN(parseFloat(form.btc)) && !isNaN(parseFloat(form.price)) && (
                <div style={{ backgroundColor: "#080810", border: "1px solid #1a1a2e", borderRadius: 7, padding: "10px 14px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#4b5563", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Cost</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: ORANGE }}>
                    ${(parseFloat(form.btc) * parseFloat(form.price)).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}

              {formError && <p style={{ fontSize: 12, color: "#ef4444" }}>{formError}</p>}
              {formSuccess && <p style={{ fontSize: 12, color: "#10b981" }}>✓ Purchase saved successfully!</p>}

              <button type="submit" disabled={submitting} style={{
                backgroundColor: ORANGE, color: "#fff", border: "none", borderRadius: 6,
                padding: "10px 0", fontSize: 13, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit", opacity: submitting ? 0.7 : 1,
              }}>
                {submitting ? "Saving…" : "Save Purchase"}
              </button>
            </form>
          </div>

          {/* Purchases table */}
          <div style={{ backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a2e", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563" }}>
                All Purchases
              </h2>
              <span style={{ fontSize: 11, color: "#374151" }}>{purchases.length} records</span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "#374151", fontSize: 13 }}>Loading…</div>
            ) : purchases.length === 0 ? (
              <div style={{ padding: 60, textAlign: "center", color: "#374151", fontSize: 13 }}>
                No purchases yet. Add one using the form.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Date", "BTC Amount", "Buy Price (USD)", "Total Cost", ""].map((h, i) => (
                      <th key={i} style={{
                        padding: "10px 16px", fontSize: 10, fontWeight: 700,
                        textTransform: "uppercase", letterSpacing: "0.1em",
                        color: "#4b5563", textAlign: i > 1 ? "right" : "left",
                        borderBottom: "1px solid #1a1a2e", backgroundColor: "#080810",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...purchases].sort((a, b) => b.date.localeCompare(a.date)).map((p, i) => (
                    <tr key={p.id} style={{ borderTop: "1px solid #12121e", backgroundColor: i % 2 === 0 ? "#0e0e1a" : "#0a0a12" }}>
                      <td style={{ padding: "11px 16px", fontSize: 12, color: "#374151" }}>{i + 1}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "#e2e8f0" }}>{fmtDate(p.date)}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: ORANGE, fontWeight: 700, textAlign: "right" }}>₿ {p.btc.toFixed(4)}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "#e2e8f0", textAlign: "right" }}>${p.price.toLocaleString("en-US")}</td>
                      <td style={{ padding: "11px 16px", fontSize: 13, color: "#e2e8f0", textAlign: "right" }}>${Math.round(p.btc * p.price).toLocaleString("en-US")}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right" }}>
                        <button onClick={() => handleDelete(p.id)} style={{
                          background: "none", border: "1px solid #1a1a2e", borderRadius: 4,
                          padding: "3px 10px", fontSize: 11, color: "#374151",
                          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                        }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.color = "#ef4444"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#374151"; }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────────
export default function AdminPage() {
  const [user, setUser]       = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#374151", fontSize: 13 }}>Checking authentication…</span>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLogin={() => {}} />;
  }

  return <AdminDashboard user={user} />;
}
