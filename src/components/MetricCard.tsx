interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
  accent?: string;
}

export default function MetricCard({ label, value, sub, valueColor, accent }: MetricCardProps) {
  const accentColor = accent || (valueColor && valueColor !== "#fff" ? valueColor : "#F7931A");

  return (
    <div style={{
      backgroundColor: "#0e0e1a",
      border: "1px solid #1a1a2e",
      borderRadius: 10,
      padding: "20px 22px 18px",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(247,147,26,0.25)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a2e")}
    >
      {/* Top accent */}
      <div style={{
        position: "absolute", top: 0, left: 0, width: "40%", height: 2,
        backgroundColor: accentColor, opacity: 0.6, borderRadius: "10px 0 0 0",
      }} />

      <p style={{
        fontSize: 10, fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "#4b5563", marginBottom: 10,
      }}>
        {label}
      </p>

      <p style={{
        fontSize: 26, fontWeight: 800, color: valueColor || "#f1f5f9",
        letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: sub ? 8 : 0,
      }}>
        {value}
      </p>

      {sub && (
        <p style={{ fontSize: 11, color: "#374151", lineHeight: 1.4 }}>{sub}</p>
      )}
    </div>
  );
}
