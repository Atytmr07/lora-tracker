"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Header from "@/components/Header";
import OverviewTab from "@/components/OverviewTab";
import ChartsTab from "@/components/ChartsTab";
import PurchasesTab from "@/components/PurchasesTab";
import Footer from "@/components/Footer";
import AddPurchaseModal from "@/components/AddPurchaseModal";
import LoginModal from "@/components/LoginModal";
import { getPurchases } from "@/lib/purchases";
import { Purchase } from "@/lib/types";

type Tab = "overview" | "charts" | "purchases";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const DAILY_URL    = "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily";
const EXTENDED_URL = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000"; // ~2.7 years daily, free
const ALL_URL      = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=600";  // ~11 years weekly, free
const PRICE_URL    = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true";

export default function HomePage() {
  const [activeTab, setActiveTab]       = useState<Tab>("overview");
  const [purchases, setPurchases]       = useState<Purchase[]>([]);
  const [loading, setLoading]           = useState(true);
  const [btcPrice, setBtcPrice]         = useState<number | null>(null);
  const [btcChange24h, setBtcChange24h] = useState<number | null>(null);
  const [user, setUser]                 = useState<User | null>(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [showLogin, setShowLogin]       = useState(false);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return unsub;
  }, []);

  // Chart data
  const { data: dailyData }    = useSWR(DAILY_URL,    fetcher, { revalidateOnFocus: false, dedupingInterval: 300_000 });
  const { data: extendedData } = useSWR(EXTENDED_URL, fetcher, { revalidateOnFocus: false, dedupingInterval: 3_600_000 });
  const { data: allTimeData }  = useSWR(ALL_URL,      fetcher, { revalidateOnFocus: false, dedupingInterval: 86_400_000 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const binanceToPoints = (raw: any): [number, number][] =>
    Array.isArray(raw) ? raw.map((k: any[]) => [Number(k[6]), parseFloat(k[4])]) : [];

  const historicalPrices: [number, number][] = dailyData?.prices   ?? [];
  const extendedPrices:   [number, number][] = binanceToPoints(extendedData);
  const allTimePrices:    [number, number][] = binanceToPoints(allTimeData);

  // Live BTC price polling
  useEffect(() => {
    async function poll() {
      try {
        const data = await fetcher(PRICE_URL);
        setBtcPrice(data.bitcoin.usd);
        setBtcChange24h(data.bitcoin.usd_24h_change ?? null);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, []);

  // Load purchases
  const loadPurchases = useCallback(async () => {
    try {
      const withTimeout = Promise.race([
        getPurchases(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Firebase timeout")), 8_000)
        ),
      ]);
      setPurchases(await withTimeout);
    } catch (e) {
      console.error(e);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  // Portfolio calculations
  const totalBtc      = purchases.reduce((s, p) => s + p.btc, 0);
  const totalInvested = purchases.reduce((s, p) => s + p.btc * p.price, 0);
  const currentValue  = btcPrice !== null ? totalBtc * btcPrice : null;
  const totalReturn   = currentValue !== null && totalInvested > 0
    ? ((currentValue - totalInvested) / totalInvested) * 100
    : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0f", display: "flex", flexDirection: "column" }}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        btcPrice={btcPrice}
        btcChange24h={btcChange24h}
        totalReturn={totalReturn}
        user={user}
        onSignIn={() => setShowLogin(true)}
        onSignOut={() => signOut(auth)}
        onAddPurchase={() => setShowAdd(true)}
      />

      <main style={{ flex: 1, maxWidth: 1280, margin: "0 auto", width: "100%", padding: "36px 28px 64px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 240, color: "#374151", fontSize: 14 }}>
            Loading portfolio…
          </div>
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab purchases={purchases} btcPrice={btcPrice} historicalPrices={historicalPrices} />
            )}
            {activeTab === "charts" && (
              <ChartsTab purchases={purchases} historicalPrices={historicalPrices} extendedPrices={extendedPrices} allTimePrices={allTimePrices} />
            )}
            {activeTab === "purchases" && (
              <PurchasesTab purchases={purchases} btcPrice={btcPrice} onDeleted={user ? loadPurchases : undefined} user={user} />
            )}
          </>
        )}
      </main>

      <Footer btcPrice={btcPrice} />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {showAdd && user && (
        <AddPurchaseModal
          btcPrice={btcPrice}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); loadPurchases(); }}
        />
      )}
    </div>
  );
}
