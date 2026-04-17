"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getTryRate } from "./currency";

interface CurrencyCtx {
  isTRY: boolean;
  toggle: () => void;
  tryRate: number;
  symbol: string;
  fmt: (usdValue: number) => string;
  fmtAxis: (usdValue: number) => string;
}

const Ctx = createContext<CurrencyCtx>({
  isTRY: false,
  toggle: () => {},
  tryRate: 1,
  symbol: "$",
  fmt: (v) => "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 }),
  fmtAxis: (v) => "$" + (v / 1000).toFixed(0) + "K",
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [isTRY, setIsTRY] = useState(false);
  const [tryRate, setTryRate] = useState(1);

  useEffect(() => {
    // Restore preference
    const saved = localStorage.getItem("currencyPref");
    if (saved === "TRY") setIsTRY(true);

    // Fetch rate
    getTryRate().then(setTryRate).catch(() => {});
  }, []);

  function toggle() {
    setIsTRY((prev) => {
      const next = !prev;
      localStorage.setItem("currencyPref", next ? "TRY" : "USD");
      return next;
    });
  }

  const rate = isTRY ? tryRate : 1;
  const symbol = isTRY ? "₺" : "$";

  function fmt(usdValue: number): string {
    const v = usdValue * rate;
    return symbol + v.toLocaleString(isTRY ? "tr-TR" : "en-US", { maximumFractionDigits: 0 });
  }

  function fmtAxis(usdValue: number): string {
    const v = usdValue * rate;
    if (v >= 1_000_000) return symbol + (v / 1_000_000).toFixed(1) + "M";
    if (v >= 1_000) return symbol + (v / 1_000).toFixed(0) + "K";
    return symbol + v.toFixed(0);
  }

  return (
    <Ctx.Provider value={{ isTRY, toggle, tryRate, symbol, fmt, fmtAxis }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCurrency() {
  return useContext(Ctx);
}
