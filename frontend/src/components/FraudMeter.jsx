// frontend/src/components/FraudMeter.jsx
// Animated semicircle gauge showing fraud probability 0–100%

import { useEffect, useState } from "react";

const COLORS = {
  low:    "#2ed573",   // green
  medium: "#ffa502",   // amber
  high:   "#ff4757",   // red
};

function getRiskLevel(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function getRiskLabel(score) {
  if (score >= 70) return "⚠ Fraudulent";
  if (score >= 40) return "~ Suspicious";
  return "✓ Legitimate";
}

// Convert score (0-100) to SVG needle position on a 180° arc
function scoreToPoint(score, cx, cy, r) {
  const angle = ((score / 100) * 180 - 180) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

export default function FraudMeter({ score = 0, animated = true }) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score);

  // Animate from 0 → score on mount or score change
  useEffect(() => {
    if (!animated) { setDisplayed(score); return; }
    let frame;
    let current = 0;
    const step = score / 40;  // 40 frames ≈ 0.67s at 60fps
    const tick = () => {
      current = Math.min(current + step, score);
      setDisplayed(Math.round(current));
      if (current < score) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  const risk    = getRiskLevel(displayed);
  const color   = COLORS[risk];
  const label   = getRiskLabel(displayed);
  const cx = 100, cy = 100, r = 72;
  const needle  = scoreToPoint(displayed, cx, cy, r - 8);
  const arcLen  = Math.PI * r;   // half circumference
  const filled  = (displayed / 100) * arcLen;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      {/* SVG gauge */}
      <div style={{ position: "relative", width: 200, height: 110 }}>
        <svg viewBox="0 0 200 110" width="200" height="110">
          {/* Track */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={14}
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke={color}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={`${filled} ${arcLen}`}
            style={{ transition: "stroke-dasharray 0.05s linear, stroke 0.3s ease" }}
          />
          {/* Needle */}
          <line
            x1={cx} y1={cy}
            x2={needle.x} y2={needle.y}
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ transition: "all 0.05s linear" }}
          />
          <circle cx={cx} cy={cy} r={5} fill={color} style={{ transition: "fill 0.3s" }} />

          {/* Min / Max labels */}
          <text x={cx - r} y={cy + 18} textAnchor="middle" fill="#6b7a8d" fontSize={10}>0</text>
          <text x={cx + r} y={cy + 18} textAnchor="middle" fill="#6b7a8d" fontSize={10}>100</text>
        </svg>

        {/* Center score */}
        <div style={{
          position: "absolute",
          bottom: 0, left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'DM Mono', monospace",
          fontSize: 30,
          fontWeight: 500,
          color,
          transition: "color 0.3s",
          lineHeight: 1,
        }}>
          {displayed}%
        </div>
      </div>

      {/* Verdict label */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 20,
        fontWeight: 800,
        color,
        transition: "color 0.3s",
      }}>
        {label}
      </div>

      {/* Risk badge */}
      <div style={{
        background: `${color}1a`,
        border: `1px solid ${color}44`,
        color,
        borderRadius: 20,
        padding: "3px 14px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "1px",
        textTransform: "uppercase",
      }}>
        {risk} risk
      </div>
    </div>
  );
}
