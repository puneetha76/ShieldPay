// frontend/src/pages/Dashboard.jsx
// Live stats, charts, and recent fraud alerts — connected to FastAPI backend.

import { useState, useEffect, useCallback } from "react";
import { getStats, getHistory } from "../api/client";
import TransactionCard from "../components/TransactionCard";

// ── Stat card ────────────────────────────────────────────────
function StatCard({ label, value, color, change }) {
  return (
    <div style={{
      background: "#131b24",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 14,
      padding: "20px 22px",
      borderTop: `2px solid ${color}`,
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a8d", marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 500, color }}>
        {value}
      </div>
      {change && (
        <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 6 }}>{change}</div>
      )}
    </div>
  );
}

// ── Mini bar chart (CSS only) ─────────────────────────────────
function MiniBarChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <div style={{
            width: "100%",
            height: `${(d.value / max) * 100}%`,
            background: d.color || "var(--accent, #00d4aa)",
            borderRadius: "3px 3px 0 0",
            minHeight: 4,
            transition: "height 0.6s ease",
          }} />
          <span style={{ fontSize: 9, color: "#6b7a8d", fontFamily: "'DM Mono', monospace" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEMO_FRAUD = [8, 12, 7, 15, 11, 9, 14];
const DEMO_LEGIT = [3200, 4100, 2900, 5200, 4800, 3600, 4400];

export default function Dashboard() {
  const [stats,   setStats  ] = useState(null);
  const [alerts,  setAlerts ] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([
        getStats(),
        getHistory(10, true),
      ]);
      setStats(s);
      setAlerts(h);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Build bar chart data
  const fraudBars = DAYS.map((d, i) => ({ label: d, value: DEMO_FRAUD[i], color: "#ff4757" }));
  const legitBars = DAYS.map((d, i) => ({ label: d, value: Math.round(DEMO_LEGIT[i] / 100), color: "#0099ff" }));

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: "#6b7a8d", fontSize: 13, marginTop: 4 }}>
          Real-time fraud monitoring
          {!loading && <span style={{ marginLeft: 8, color: "#00d4aa", fontSize: 11 }}>● Live</span>}
        </p>
      </div>

      {error && (
        <div style={{
          background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)",
          borderRadius: 10, padding: "12px 16px", marginBottom: 24,
          color: "#ff6b78", fontSize: 13,
        }}>
          ⚠ API not reachable: {error}. Make sure the FastAPI backend is running on port 8000.
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total Predictions" color="#00d4aa"
          value={stats ? stats.total_predictions.toLocaleString() : "—"}
          change="From database" />
        <StatCard label="Fraud Detected" color="#ff4757"
          value={stats ? stats.fraud_detected.toLocaleString() : "—"}
          change="True positives" />
        <StatCard label="Fraud Rate" color="#ffa502"
          value={stats ? `${stats.fraud_rate_pct.toFixed(4)}%` : "—"}
          change="Of all predictions" />
        <StatCard label="Safe Transactions" color="#0099ff"
          value={stats ? stats.safe_transactions.toLocaleString() : "—"}
          change="Legitimate" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            Fraud This Week
            <span style={{ fontSize: 10, background: "rgba(0,212,170,0.1)", color: "#00d4aa", padding: "2px 8px", borderRadius: 20 }}>Demo data</span>
          </div>
          <MiniBarChart data={fraudBars} />
        </div>
        <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 18 }}>Legitimate (×100)</div>
          <MiniBarChart data={legitBars} />
        </div>
      </div>

      {/* Recent alerts */}
      <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          Recent Fraud Alerts
          {alerts.length > 0 && (
            <span style={{ fontSize: 10, background: "rgba(255,71,87,0.1)", color: "#ff4757", padding: "2px 10px", borderRadius: 20 }}>
              ⚠ {alerts.length} flagged
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ color: "#6b7a8d", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Loading…</div>
        ) : alerts.length === 0 ? (
          <div style={{ color: "#6b7a8d", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            No fraud detected yet. Run some predictions first!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {alerts.map((log) => (
              <TransactionCard
                key={log.id}
                id={`TXN-${log.id}`}
                amount={log.amount}
                riskScore={log.risk_score}
                riskLevel={log.risk_score >= 70 ? "high" : log.risk_score >= 40 ? "medium" : "low"}
                isFraud={log.is_fraud}
                topFeature={log.top_features?.[0]?.feature || "N/A"}
                timestamp={log.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
