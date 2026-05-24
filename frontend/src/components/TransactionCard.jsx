// frontend/src/components/TransactionCard.jsx
// Reusable card showing a single transaction result row.

const RISK_COLORS = {
  high:   "#ff4757",
  medium: "#ffa502",
  low:    "#2ed573",
};

export default function TransactionCard({
  id,
  amount,
  riskScore   = 0,
  riskLevel   = "low",
  isFraud     = false,
  topFeature  = "N/A",
  timestamp,
  onViewDetails,
}) {
  const color = RISK_COLORS[riskLevel] || "#6b7a8d";

  return (
    <div style={{
      background: "#131b24",
      border: `1px solid ${isFraud ? "rgba(255,71,87,0.25)" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      transition: "border-color 0.2s, background 0.2s",
      cursor: onViewDetails ? "pointer" : "default",
    }}
    onClick={onViewDetails}
    onMouseEnter={e => {
      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      e.currentTarget.style.borderColor = isFraud
        ? "rgba(255,71,87,0.45)" : "rgba(255,255,255,0.13)";
    }}
    onMouseLeave={e => {
      e.currentTarget.style.background = "#131b24";
      e.currentTarget.style.borderColor = isFraud
        ? "rgba(255,71,87,0.25)" : "rgba(255,255,255,0.07)";
    }}>

      {/* Left: ID + amount */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          color: "#6b7a8d",
          marginBottom: 4,
        }}>
          {id || "TXN"}
        </div>
        <div style={{ fontSize: 15, fontWeight: 500, color: "#e8edf2" }}>
          €{typeof amount === "number" ? amount.toFixed(2) : amount}
        </div>
        {timestamp && (
          <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 2 }}>
            {new Date(timestamp).toLocaleString()}
          </div>
        )}
      </div>

      {/* Middle: Risk bar */}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            flex: 1,
            height: 4,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 2,
            overflow: "hidden",
          }}>
            <div style={{
              width: `${riskScore}%`,
              height: "100%",
              background: color,
              borderRadius: 2,
            }} />
          </div>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
            color,
            minWidth: 38,
          }}>
            {riskScore}%
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 4 }}>
          Top: {topFeature}
        </div>
      </div>

      {/* Right: Verdict badge */}
      <div>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 12px",
          borderRadius: 20,
          background: isFraud ? "rgba(255,71,87,0.12)" : "rgba(46,213,115,0.12)",
          color:      isFraud ? "#ff4757" : "#2ed573",
          border:     `1px solid ${isFraud ? "rgba(255,71,87,0.25)" : "rgba(46,213,115,0.2)"}`,
          whiteSpace: "nowrap",
        }}>
          {isFraud ? "⚠ Fraud" : "✓ Safe"}
        </span>
      </div>
    </div>
  );
}
