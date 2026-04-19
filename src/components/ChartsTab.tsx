"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart, LineController, LineElement, PointElement,
  LinearScale, TimeScale, Tooltip, Legend, Filler,
  BarController, BarElement, CategoryScale,
  type ChartDataset,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { Purchase } from "@/lib/types";
import { useCurrency } from "@/lib/currency-context";
import { useIsMobile } from "@/lib/use-mobile";

Chart.register(
  LineController, LineElement, PointElement,
  LinearScale, TimeScale, Tooltip, Legend, Filler,
  BarController, BarElement, CategoryScale,
);

type TimeRange = "1W" | "1M" | "3M" | "6M" | "YTD" | "1Y" | "2Y" | "3Y" | "ALL";
const RANGES: TimeRange[] = ["1W", "1M", "3M", "6M", "YTD", "1Y", "2Y", "3Y", "ALL"];

const ORANGE = "#F7931A";
const GREEN  = "#10b981";
const RED    = "#ef4444";
const PURPLE = "#8b5cf6";
const GRID   = "rgba(255,255,255,0.04)";
const MUTED  = "#4b5563";

interface Props {
  purchases:        Purchase[];
  historicalPrices: [number, number][];
  extendedPrices:   [number, number][];
  allTimePrices:    [number, number][];
}

type Pt = { x: number; y: number };

function filterRange(
  daily:    [number, number][],
  extended: [number, number][],
  all:      [number, number][],
  range:    TimeRange,
): [number, number][] {
  if (range === "ALL") return all.length ? all : extended.length ? extended : daily;
  const now = Date.now();
  const cutoffs: Record<Exclude<TimeRange, "ALL">, number> = {
    "1W":  now - 7   * 86_400_000,
    "1M":  now - 30  * 86_400_000,
    "3M":  now - 90  * 86_400_000,
    "6M":  now - 180 * 86_400_000,
    "YTD": new Date(new Date().getFullYear(), 0, 1).getTime(),
    "1Y":  now - 365 * 86_400_000,
    "2Y":  now - 730 * 86_400_000,
    "3Y":  now - 1095 * 86_400_000,
  };
  const cutoff = cutoffs[range as Exclude<TimeRange, "ALL">];
  // Use extended (Binance daily) for 2Y/3Y, CoinGecko daily for shorter ranges
  const src = (range === "2Y" || range === "3Y") ? (extended.length ? extended : daily) : daily;
  return src.filter(([ts]) => ts >= cutoff);
}

function calc200WMA(prices: [number, number][]): Pt[] {
  return prices.map((_, i) => {
    const win   = Math.min(i + 1, 200 * 7);
    const slice = prices.slice(Math.max(0, i - win + 1), i + 1);
    const totW  = slice.reduce((s, _, j) => s + (j + 1), 0);
    const wma   = slice.reduce((s, [, p], j) => s + p * (j + 1), 0) / totW;
    return { x: prices[i][0], y: wma };
  });
}

function calcRadius(btc: number, lo: number, hi: number) {
  return lo === hi ? 4 : 3 + ((btc - lo) / (hi - lo)) * 7;
}

export default function ChartsTab({ purchases, historicalPrices, extendedPrices, allTimePrices }: Props) {
  const { isTRY, tryRate, fmtAxis, fmt } = useCurrency();
  const [range, setRange]     = useState<TimeRange>("1Y");
  const [zoomReady, setZoomReady] = useState(false);
  const isMobile = useIsMobile();

  const c1 = useRef<HTMLCanvasElement>(null);
  const c2 = useRef<HTMLCanvasElement>(null);
  const c3 = useRef<HTMLCanvasElement>(null);
  const c4 = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i1 = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i2 = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i3 = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i4 = useRef<any>(null);

  // Load zoom plugin once — set flag so charts rebuild after it's registered
  useEffect(() => {
    import("chartjs-plugin-zoom").then(({ default: zoomPlugin }) => {
      Chart.register(zoomPlugin);
      setZoomReady(true);
    }).catch(() => setZoomReady(true)); // build charts even if zoom fails
  }, []);

  useEffect(() => {
    if (!zoomReady) return; // wait until zoom plugin is registered

    const prices = filterRange(historicalPrices, extendedPrices, allTimePrices, range);
    if (!prices.length) return;

    const minTs = prices[0][0];
    const maxTs = prices[prices.length - 1][0];

    const zoomOpts = {
      pan: {
        enabled: true,
        mode: "x" as const,
        threshold: 5,
      },
      zoom: {
        wheel: { enabled: true, speed: 0.08 },
        pinch: { enabled: true },
        mode: "x" as const,
      },
      limits: {
        x: { min: minTs, max: maxTs, minRange: 7 * 86_400_000 },
      },
    };

    const sc     = isTRY ? tryRate : 1;
    const sym    = isTRY ? "₺" : "$";
    const sorted = [...purchases].sort((a, b) => a.date.localeCompare(b.date));
    const btcArr = purchases.map(p => p.btc);
    const minB   = btcArr.length ? Math.min(...btcArr) : 0;
    const maxB   = btcArr.length ? Math.max(...btcArr) : 1;

    const pricePts: Pt[] = prices.map(([ts, p]) => ({ x: ts, y: p * sc }));

    // Running avg cost
    let cumC = 0, cumB = 0;
    const avgCostPts: Pt[] = prices.map(([ts]) => {
      const d = new Date(ts).toISOString().split("T")[0];
      for (const p of sorted) if (p.date === d) { cumC += p.btc * p.price; cumB += p.btc; }
      return { x: ts, y: cumB > 0 ? (cumC / cumB) * sc : 0 };
    });

    // Cumulative BTC
    let accB = 0;
    const stackPts: Pt[] = prices.map(([ts]) => {
      const d = new Date(ts).toISOString().split("T")[0];
      for (const p of sorted) if (p.date === d) accB += p.btc;
      return { x: ts, y: accB };
    });

    // Portfolio value vs total invested
    let accB3 = 0, cumCost = 0;
    const portPts: Pt[]     = [];
    const investedPts: Pt[] = [];
    for (const [ts, price] of prices) {
      const d = new Date(ts).toISOString().split("T")[0];
      for (const p of sorted) if (p.date === d) { accB3 += p.btc; cumCost += p.btc * p.price; }
      portPts.push({ x: ts, y: accB3 * price * sc });
      investedPts.push({ x: ts, y: cumCost * sc });
    }

    // 200-WMA
    const wmaPts: Pt[] = calc200WMA(prices).map(({ x, y }) => ({ x, y: y * sc }));

    // Per-purchase returns (for bar chart)
    const latestPrice = prices[prices.length - 1]?.[1] ?? 0;
    const barLabels   = purchases.map((p, i) => `#${i + 1} ${p.date}`);
    const barData     = purchases.map(p => latestPrice > 0 ? ((latestPrice - p.price) / p.price) * 100 : 0);
    const barColors   = barData.map(v => v >= 0 ? "rgba(16,185,129,0.75)" : "rgba(239,68,68,0.75)");
    const barBorders  = barData.map(v => v >= 0 ? GREEN : RED);

    // Shared axis / tooltip config — adaptive time unit based on range
    const xTimeUnit =
      range === "1W"                    ? "day"   :
      range === "1M" || range === "3M"  ? "week"  :
      range === "ALL"                   ? "year"  : "month";

    const xAxis = {
      type: "time" as const,
      time: {
        minUnit: "day" as const,
        unit: xTimeUnit as "day" | "week" | "month" | "year",
        displayFormats: { day: "MMM d", week: "MMM d", month: "MMM yy", year: "yyyy" },
      },
      grid: { color: GRID },
      ticks: { color: MUTED, font: { size: 11 }, maxRotation: 0, maxTicksLimit: 10 },
      border: { color: "#1a1a2e" },
    };
    const yAxis = (cb: (v: number) => string) => ({
      grid: { color: GRID },
      ticks: { color: MUTED, font: { size: 11 }, callback: (v: number | string) => cb(Number(v)) },
      border: { color: "#1a1a2e" },
    });
    const tip = {
      backgroundColor: "#0e0e1a", borderColor: "#1a1a2e", borderWidth: 1,
      titleColor: "#6b7280", bodyColor: "#e2e8f0", padding: 12,
      cornerRadius: 8, titleFont: { size: 11 }, bodyFont: { size: 13 },
    };

    // Custom purchase bubble plugin
    const bubblePlugin = {
      id: "purchaseBubbles",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      afterDatasetsDraw(chart: any) {
        if (!purchases.length) return;
        const { ctx, scales, chartArea } = chart;
        sorted.forEach(p => {
          const ts = new Date(p.date).getTime();
          const x: number = scales["x"].getPixelForValue(ts);
          if (x < chartArea.left || x > chartArea.right) return;
          const y: number = scales["y"].getPixelForValue(p.price * sc);
          if (y < chartArea.top || y > chartArea.bottom) return;
          const r = calcRadius(p.btc, minB, maxB);

          ctx.save();
          ctx.shadowColor = "rgba(247,147,26,0.5)";
          ctx.shadowBlur  = r + 4;
          ctx.beginPath();
          ctx.arc(x, y, r + 2, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = ORANGE;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x - r * 0.22, y - r * 0.28, r * 0.38, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.3)";
          ctx.fill();
          ctx.restore();
        });
      },
    };

    // ── Chart 1: Price + avg cost + 200-WMA + bubbles ─────────────
    if (c1.current) {
      i1.current?.destroy();
      i1.current = new Chart(c1.current, {
        type: "line",
        plugins: [bubblePlugin],
        data: {
          datasets: [
            {
              label: `BTC Price (${sym})`,
              data: pricePts as ChartDataset<"line">["data"],
              borderColor: ORANGE, borderWidth: 2.5,
              pointRadius: 0, tension: 0.1, fill: false, order: 3,
            },
            {
              label: `Avg Cost (${sym})`,
              data: avgCostPts as ChartDataset<"line">["data"],
              borderColor: GREEN, borderWidth: 2, borderDash: [6, 4],
              pointRadius: 0, stepped: true, fill: false, order: 2,
            },
            {
              label: "200-WMA",
              data: wmaPts as ChartDataset<"line">["data"],
              borderColor: PURPLE, borderWidth: 1.5, borderDash: [3, 3],
              pointRadius: 0, tension: 0.3, fill: false, order: 1,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 0 },
          transitions: { zoom: { animation: { duration: 250, easing: "easeOutCubic" } } },
          interaction: { mode: "index", intersect: false },
          scales: { x: xAxis, y: yAxis(v => fmtAxis(v / sc)) },
          plugins: {
            legend: {
              display: true,
              labels: { color: "#6b7280", font: { size: 12 }, boxWidth: 14, padding: 20, usePointStyle: true },
            },
            tooltip: {
              ...tip,
              callbacks: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                title: (items: any[]) => new Date(items[0].parsed.x).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label: (item: any) => {
                  const usd = Number(item.raw.y) / sc;
                  let lbl = `  ${item.dataset.label}: ${fmt(usd)}`;
                  if (item.datasetIndex === 0) {
                    const d   = new Date(item.parsed.x).toISOString().split("T")[0];
                    const pur = purchases.find(p => p.date === d);
                    if (pur) lbl += `  ● Purchase ₿${pur.btc}`;
                  }
                  return lbl;
                },
              },
            },
            zoom: zoomOpts,
          },
        },
      });
    }

    // ── Chart 2: Cumulative BTC ────────────────────────────────────
    if (c2.current) {
      i2.current?.destroy();
      i2.current = new Chart(c2.current, {
        type: "line",
        data: {
          datasets: [{
            label: "BTC Held",
            data: stackPts as ChartDataset<"line">["data"],
            borderColor: ORANGE, borderWidth: 2,
            pointRadius: 0, stepped: true, fill: true,
            backgroundColor: "rgba(247,147,26,0.07)",
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 0 },
          transitions: { zoom: { animation: { duration: 250, easing: "easeOutCubic" } } },
          scales: { x: xAxis, y: yAxis(v => "₿ " + v.toFixed(v < 1 ? 3 : 2)) },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...tip,
              callbacks: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                title: (i: any[]) => new Date(i[0].parsed.x).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label: (i: any) => `  BTC Held: ₿ ${Number(i.raw.y).toFixed(4)}`,
              },
            },
            zoom: zoomOpts,
          },
        },
      });
    }

    // ── Chart 3: Portfolio value vs. Total invested ───────────────
    if (c3.current) {
      i3.current?.destroy();

      // Profit/loss fill plugin — shades area between portfolio and invested
      const fillPlugin = {
        id: "profitFill",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        beforeDatasetsDraw(chart: any) {
          const { ctx, chartArea, scales } = chart;
          const ds0 = chart.data.datasets[0].data as Pt[];
          const ds1 = chart.data.datasets[1].data as Pt[];
          if (!ds0.length || !ds1.length) return;

          ctx.save();
          ctx.beginPath();
          ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
          ctx.clip();

          for (let i = 0; i < ds0.length - 1; i++) {
            const x0 = scales.x.getPixelForValue(ds0[i].x);
            const x1 = scales.x.getPixelForValue(ds0[i + 1].x);
            const yPort0 = scales.y.getPixelForValue(ds0[i].y);
            const yPort1 = scales.y.getPixelForValue(ds0[i + 1].y);
            const yInv0  = scales.y.getPixelForValue(ds1[i].y);
            const yInv1  = scales.y.getPixelForValue(ds1[i + 1].y);

            const isUp = ds0[i].y >= ds1[i].y;
            ctx.beginPath();
            ctx.moveTo(x0, yPort0);
            ctx.lineTo(x1, yPort1);
            ctx.lineTo(x1, yInv1);
            ctx.lineTo(x0, yInv0);
            ctx.closePath();
            ctx.fillStyle = isUp
              ? "rgba(16,185,129,0.12)"
              : "rgba(239,68,68,0.12)";
            ctx.fill();
          }
          ctx.restore();
        },
      };

      i3.current = new Chart(c3.current, {
        type: "line",
        plugins: [fillPlugin],
        data: {
          datasets: [
            {
              label: `Portfolio Value (${sym})`,
              data: portPts as ChartDataset<"line">["data"],
              borderColor: GREEN, borderWidth: 2,
              pointRadius: 0, tension: 0.1, fill: false,
            },
            {
              label: `Total Invested (${sym})`,
              data: investedPts as ChartDataset<"line">["data"],
              borderColor: ORANGE, borderWidth: 1.5, borderDash: [5, 4],
              pointRadius: 0, stepped: true, fill: false,
            },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          animation: { duration: 0 },
          transitions: { zoom: { animation: { duration: 250, easing: "easeOutCubic" } } },
          interaction: { mode: "index", intersect: false },
          scales: { x: xAxis, y: yAxis(v => fmtAxis(v / sc)) },
          plugins: {
            legend: {
              display: true,
              labels: { color: "#6b7280", font: { size: 11 }, boxWidth: 12, padding: 16, usePointStyle: true },
            },
            tooltip: {
              ...tip,
              callbacks: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                title: (i: any[]) => new Date(i[0].parsed.x).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label: (i: any) => `  ${i.dataset.label}: ${fmt(Number(i.raw.y) / sc)}`,
              },
            },
            zoom: zoomOpts,
          },
        },
      });
    }

    // ── Chart 4: Per-purchase return % bar chart ──────────────────
    if (c4.current) {
      i4.current?.destroy();

      if (purchases.length === 0) {
        // Nothing to show — render empty state via canvas text
        const canvas = c4.current;
        const ctx    = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#374151";
          ctx.font      = "13px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("No purchases yet", canvas.width / 2, canvas.height / 2);
        }
      } else {
        i4.current = new Chart(c4.current, {
          type: "bar",
          data: {
            labels: barLabels,
            datasets: [{
              label: "Return %",
              data: barData,
              backgroundColor: barColors,
              borderColor: barBorders,
              borderWidth: 1,
              borderRadius: 4,
            }],
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: false,
            scales: {
              x: {
                grid: { color: GRID },
                ticks: { color: MUTED, font: { size: 10 }, maxRotation: 35 },
                border: { color: "#1a1a2e" },
              },
              y: {
                grid: { color: GRID },
                border: { color: "#1a1a2e" },
                ticks: {
                  color: MUTED, font: { size: 11 },
                  callback: (v: number | string) => (Number(v) >= 0 ? "+" : "") + Number(v).toFixed(0) + "%",
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                ...tip,
                callbacks: {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  title: (i: any[]) => i[0].label,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label: (i: any) => {
                    const v = Number(i.raw);
                    const p = purchases[i.dataIndex];
                    return [
                      `  Return: ${v >= 0 ? "+" : ""}${v.toFixed(2)}%`,
                      `  Buy: ${fmt(p.price)}  ·  BTC: ₿${p.btc}`,
                    ];
                  },
                },
              },
            },
          },
        });
      }
    }

    return () => {
      i1.current?.destroy();
      i2.current?.destroy();
      i3.current?.destroy();
      i4.current?.destroy();
    };
  }, [historicalPrices, extendedPrices, allTimePrices, purchases, range, isTRY, tryRate, zoomReady]);

  // ── Reset zoom handlers ──────────────────────────────────────────
  const resetAll = () => {
    i1.current?.resetZoom?.();
    i2.current?.resetZoom?.();
    i3.current?.resetZoom?.();
  };

  const Card = ({
    title, children, height = 320, fullWidth = false, onReset,
  }: {
    title: string; children: React.ReactNode; height?: number;
    fullWidth?: boolean; onReset?: () => void;
  }) => (
    <div style={{
      backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e",
      borderRadius: 10, padding: "20px 24px",
      gridColumn: fullWidth ? "1 / -1" : undefined,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563" }}>
          {title}
        </p>
        {onReset && (
          <button onClick={onReset} style={{
            background: "none", border: "1px solid #1a1a2e", borderRadius: 4,
            padding: "2px 9px", fontSize: 10, color: "#4b5563", cursor: "pointer",
            fontFamily: "inherit", letterSpacing: "0.05em", transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#F7931A"; e.currentTarget.style.color = "#F7931A"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#4b5563"; }}
          >
            Reset Zoom
          </button>
        )}
      </div>
      <div style={{ height, position: "relative" }}>
        {!historicalPrices.length
          ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#374151", fontSize: 13 }}>Loading chart data…</div>
          : children}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Time range selector */}
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: 10 }}>
        {!isMobile && (
          <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#4b5563" }}>
            Time Range
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <button onClick={resetAll} style={{
            background: "none", border: "1px solid #1a1a2e", borderRadius: 6,
            padding: "5px 10px", fontSize: 11, color: "#4b5563", cursor: "pointer",
            fontFamily: "inherit", letterSpacing: "0.04em", transition: "all 0.15s", flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#F7931A"; e.currentTarget.style.color = "#F7931A"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1a1a2e"; e.currentTarget.style.color = "#4b5563"; }}
          >
            ↺ Reset
          </button>
          {/* Scrollable range buttons on mobile */}
          <div style={{
            display: "flex", gap: 2,
            backgroundColor: "#0e0e1a", border: "1px solid #1a1a2e", borderRadius: 8, padding: 3,
            overflowX: isMobile ? "auto" : "visible",
            flex: isMobile ? 1 : undefined,
          }}>
            {RANGES.map(r => {
              const active = range === r;
              return (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: isMobile ? "5px 10px" : "5px 13px",
                  borderRadius: 6, border: "none", cursor: "pointer",
                  fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: "inherit",
                  letterSpacing: "0.03em", transition: "all 0.15s", flexShrink: 0,
                  backgroundColor: active ? "#F7931A" : "transparent",
                  color: active ? "#fff" : "#4b5563",
                }}>
                  {r}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Chart 1 — BTC price + avg cost + 200-WMA */}
      <Card
        title={isMobile ? "BTC Price · Avg Cost · 200-WMA" : "BTC Price · Avg Cost · 200-WMA  (● = purchase, size ∝ BTC amount)"}
        height={isMobile ? 260 : 380}
        fullWidth
        onReset={() => i1.current?.resetZoom?.()}
      >
        <canvas ref={c1} />
      </Card>

      {/* Charts 2 & 3 — side by side on desktop, stacked on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <Card title="Cumulative BTC Accumulation" height={isMobile ? 220 : 260} onReset={() => i2.current?.resetZoom?.()}>
          <canvas ref={c2} />
        </Card>
        <Card title={isMobile ? "Portfolio vs. Invested" : "Portfolio Value vs. Total Invested  (green = profit, red = loss)"} height={isMobile ? 220 : 260} onReset={() => i3.current?.resetZoom?.()}>
          <canvas ref={c3} />
        </Card>
      </div>

      {/* Chart 4 — per-purchase return bar chart */}
      <Card title="Per-Purchase Return (%)" height={isMobile ? 200 : 220} fullWidth>
        <canvas ref={c4} />
      </Card>
    </div>
  );
}
