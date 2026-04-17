"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Mode = "login" | "register" | "reset";

export default function AuthGate() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === "register") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await sendPasswordResetEmail(auth, email);
        setResetSent(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bir hata oluştu.";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Email veya şifre hatalı.");
      } else if (msg.includes("email-already-in-use")) {
        setError("Bu email adresi zaten kayıtlı.");
      } else if (msg.includes("weak-password")) {
        setError("Şifre en az 6 karakter olmalı.");
      } else {
        setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#0a0a0f",
    border: "1px solid #1e1e2e",
    borderRadius: 4,
    padding: "10px 12px",
    color: "#fff",
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    transition: "border-color 0.15s",
  };

  const btnStyle: React.CSSProperties = {
    backgroundColor: "#F7931A",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "11px 0",
    fontSize: 14,
    fontWeight: 600,
    cursor: loading ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    width: "100%",
    opacity: loading ? 0.7 : 1,
    transition: "opacity 0.15s",
  };

  const linkStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#F7931A",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    padding: 0,
    textDecoration: "underline",
  };

  const titles: Record<Mode, string> = {
    login: "Giriş Yap",
    register: "Hesap Oluştur",
    reset: "Şifremi Unuttum",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#F7931A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 20,
            color: "#fff",
          }}
        >
          ₿
        </div>
        <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>
          BTC Tracker
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: "#111118",
          border: "1px solid #1e1e2e",
          borderRadius: 8,
          padding: "32px 32px",
          width: "100%",
          maxWidth: 380,
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          {titles[mode]}
        </h1>

        {mode === "reset" && resetSent ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#22c55e", fontSize: 14, marginBottom: 20 }}>
              Şifre sıfırlama linki email adresinize gönderildi.
            </p>
            <button style={linkStyle} onClick={() => { setMode("login"); setResetSent(false); }}>
              Giriş sayfasına dön
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label
                style={{
                  fontSize: 11,
                  color: "#4b5563",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  display: "block",
                  marginBottom: 6,
                  fontWeight: 600,
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="ornek@email.com"
                autoComplete="email"
                required
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label
                  style={{
                    fontSize: 11,
                    color: "#4b5563",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    display: "block",
                    marginBottom: 6,
                    fontWeight: 600,
                  }}
                >
                  Şifre
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  placeholder={mode === "register" ? "En az 6 karakter" : "••••••••"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  required
                />
              </div>
            )}

            {error && (
              <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
            )}

            <button type="submit" style={btnStyle} disabled={loading}>
              {loading
                ? "Yükleniyor…"
                : mode === "login"
                ? "Giriş Yap"
                : mode === "register"
                ? "Hesap Oluştur"
                : "Link Gönder"}
            </button>
          </form>
        )}

        {/* Mode switcher */}
        {!resetSent && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 20,
              borderTop: "1px solid #1e1e2e",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "center",
            }}
          >
            {mode === "login" && (
              <>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>
                  Hesabın yok mu?{" "}
                  <button style={linkStyle} onClick={() => { setMode("register"); setError(""); }}>
                    Kayıt ol
                  </button>
                </span>
                <button style={{ ...linkStyle, color: "#4b5563" }} onClick={() => { setMode("reset"); setError(""); }}>
                  Şifremi unuttum
                </button>
              </>
            )}
            {mode === "register" && (
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Zaten hesabın var mı?{" "}
                <button style={linkStyle} onClick={() => { setMode("login"); setError(""); }}>
                  Giriş yap
                </button>
              </span>
            )}
            {mode === "reset" && (
              <button style={linkStyle} onClick={() => { setMode("login"); setError(""); }}>
                Giriş sayfasına dön
              </button>
            )}
          </div>
        )}
      </div>

      <p style={{ fontSize: 12, color: "#4b5563", marginTop: 24, textAlign: "center" }}>
        Bitcoin alımlarını kişisel olarak takip et.
      </p>
    </div>
  );
}
