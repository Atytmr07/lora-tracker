"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface Props { onClose: () => void; }

export default function LoginModal({ onClose }: Props) {
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
      onClose();
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  const I: React.CSSProperties = {
    backgroundColor: "#080810", border: "1px solid #1a1a2e", borderRadius: 6,
    padding: "10px 13px", color: "#e2e8f0", fontSize: 14, fontFamily: "inherit",
    outline: "none", width: "100%",
  };

  return (
    <>
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 100, backdropFilter: "blur(2px)",
      }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 101, backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
        borderRadius: 12, padding: 32, width: "100%", maxWidth: 380,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>Sign In</h2>
            <p style={{ fontSize: 12, color: "#4b5563" }}>Admin access required to add or delete purchases.</p>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "#4b5563",
            cursor: "pointer", fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", display: "block", marginBottom: 7 }}>
              Email
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              style={I} autoFocus required />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563", display: "block", marginBottom: 7 }}>
              Password
            </label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              style={I} required />
          </div>

          {error && <p style={{ fontSize: 13, color: "#ef4444" }}>{error}</p>}

          <button type="submit" disabled={loading} style={{
            backgroundColor: "#F7931A", color: "#fff", border: "none", borderRadius: 6,
            padding: "11px 0", fontSize: 14, fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit", opacity: loading ? 0.7 : 1, marginTop: 4,
          }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </>
  );
}
