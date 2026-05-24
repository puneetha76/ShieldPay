// frontend/src/components/ShapChart.jsx
// Horizontal bar chart showing top SHAP feature contributions.

export default function ShapChart({ features = [], maxBars = 7 }) {
  if (!features || features.length === 0) {
    return (
      <div style={{ color: "#6b7a8d", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
        No SHAP data available
      </div>
    );
  }

  const top = features.slice(0, maxBars);
  const maxAbs = Math.max(...top.map((f) => Math.abs(f.value)), 0.001);

  return (
    <div>
      <div style={{
        fontSize: 10,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "#6b7a8d",
        marginBottom: 14,
      }}>
        Top Risk Factors (SHAP)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {top.map((item, i) => {
          const isPositive = item.value > 0;
          const width = `${(Math.abs(item.value) / maxAbs) * 100}%`;
          const color = isPositive ? "#ff4757" : "#2ed573";
          const sign  = isPositive ? "+" : "−";

          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Feature name */}
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color: "#6b7a8d",
                width: 52,
                textAlign: "right",
                flexShrink: 0,
              }}>
                {item.feature}
              </div>

              {/* Bar track */}
              <div style={{
                flex: 1,
                height: 6,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 3,
                overflow: "hidden",
              }}>
                <div style={{
                  width,
                  height: "100%",
                  background: color,
                  borderRadius: 3,
                  transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>

              {/* Value */}
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: 11,
                color,
                width: 52,
                flexShrink: 0,
              }}>
                {sign}{Math.abs(item.value).toFixed(3)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7a8d" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "#ff4757" }} />
          Increases fraud risk
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7a8d" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: "#2ed573" }} />
          Decreases fraud risk
        </div>
      </div>
    </div>
  );
}
