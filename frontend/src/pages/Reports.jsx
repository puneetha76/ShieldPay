// frontend/src/pages/Reports.jsx
import { useState, useEffect } from "react";
import { getHistory, getStats } from "../api/client";
import ShapChart from "../components/ShapChart";

function MetricCard({ name, value, desc, color = "#00d4aa" }) {
  return (
    <div style={{
      background: "#131b24",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "18px 20px",
    }}>
      <div style={{ fontSize: 10, color: "#6b7a8d", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 500, color }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 4 }}>{desc}</div>
    </div>
  );
}

function ConfCell({ value, label, bg, color }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color }}>{value}</span>
      <span style={{ fontSize: 10, color: "#6b7a8d", textTransform: "uppercase", letterSpacing: "1px" }}>{label}</span>
    </div>
  );
}

export default function Reports() {
  const [stats,   setStats  ] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getStats(), getHistory(100)]).then(([s, h]) => {
      setStats(s);
      setHistory(h);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Derive confusion matrix from real history
  const tp = history.filter(h => h.is_fraud && h.fraud_prob >= 0.5).length;
  const fp = history.filter(h => !h.is_fraud && h.fraud_prob >= 0.5).length;
  const fn = history.filter(h => h.is_fraud && h.fraud_prob < 0.5).length;
  const tn = history.filter(h => !h.is_fraud && h.fraud_prob < 0.5).length;
  const hasHistory = history.length > 0;

  // Aggregate top SHAP features from history
  const shapCount = {};
  history.forEach(h => {
    (h.top_features || []).forEach(f => {
      shapCount[f.feature] = (shapCount[f.feature] || 0) + Math.abs(f.value || 0);
    });
  });
  const shapFeatures = Object.entries(shapCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([feature, value]) => ({ feature, value: parseFloat((value / Math.max(history.length, 1)).toFixed(4)) }));

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>
          Reports
        </h1>
        <p style={{ color: "#6b7a8d", fontSize: 13, marginTop: 4 }}>
          Model evaluation metrics, confusion matrix, and performance overview
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#6b7a8d", textAlign: "center", padding: 40 }}>Loading…</div>
      ) : (
        <>
          {/* Live stats from DB */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <MetricCard
              name="Total Predictions"
              value={stats ? stats.total_predictions.toLocaleString() : "—"}
              desc="From your FastAPI database"
              color="#00d4aa"
            />
            <MetricCard
              name="Fraud Detected"
              value={stats ? stats.fraud_detected.toLocaleString() : "—"}
              desc="Flagged as fraudulent"
              color="#ff4757"
            />
            <MetricCard
              name="Live Fraud Rate"
              value={stats ? `${stats.fraud_rate_pct.toFixed(4)}%` : "—"}
              desc="Actual rate from predictions"
              color="#ffa502"
            />
          </div>

          {/* Model benchmark metrics (from training notebook) */}
          <div style={{ marginBottom: 8, fontSize: 11, color: "#6b7a8d", letterSpacing: "1px", textTransform: "uppercase" }}>
            Model Performance (from 03_Training.ipynb)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <MetricCard name="AUC-ROC"   value="0.987" desc="Area under ROC — near perfect"         color="#00d4aa" />
            <MetricCard name="F1 Score"  value="0.940" desc="Harmonic mean of precision & recall"   color="#0099ff" />
            <MetricCard name="Precision" value="0.956" desc="95.6% of fraud flags are real fraud"   color="#ffa502" />
            <MetricCard name="Recall"    value="0.924" desc="Catches 92.4% of all actual fraud"     color="#2ed573" />
            <MetricCard name="False Positive Rate" value="0.044%" desc="Legit txns incorrectly flagged" color="#ffa502" />
            <MetricCard name="Training Samples" value="227,845" desc="80/20 split with SMOTE"       color="#6b7a8d" />
          </div>

          {/* Confusion matrix + SHAP side by side */}
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 20, alignItems: "start" }}>

            {/* Confusion matrix */}
            <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Confusion Matrix</div>
              <div style={{ fontSize: 11, color: "#6b7a8d", marginBottom: 16 }}>
                {hasHistory ? `From ${history.length} logged predictions` : "Test set — 56,962 samples (from notebook)"}
              </div>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                {/* Row label */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 6, marginTop: 28 }}>
                  <div style={{ fontSize: 10, color: "#6b7a8d", textAlign: "right" }}>ACTUAL</div>
                  <div style={{ fontSize: 11, color: "#6b7a8d", textAlign: "right" }}>Fraud</div>
                  <div style={{ marginTop: 16, fontSize: 11, color: "#6b7a8d", textAlign: "right" }}>Legit</div>
                </div>

                <div>
                  {/* Col labels */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 6, paddingLeft: 4 }}>
                    <div style={{ width: 100, fontSize: 10, color: "#6b7a8d", textAlign: "center" }}>PRED FRAUD</div>
                    <div style={{ width: 100, fontSize: 10, color: "#6b7a8d", textAlign: "center" }}>PRED LEGIT</div>
                  </div>
                  {/* Row 1: Fraud actual */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
                    <ConfCell value={hasHistory ? tp : 90}    label="True Pos"  bg="rgba(46,213,115,0.1)"  color="#2ed573" />
                    <ConfCell value={hasHistory ? fn : 7}     label="False Neg" bg="rgba(255,71,87,0.1)"   color="#ff4757" />
                  </div>
                  {/* Row 2: Legit actual */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    <ConfCell value={hasHistory ? fp : 4}     label="False Pos" bg="rgba(255,165,2,0.1)"   color="#ffa502" />
                    <ConfCell value={hasHistory ? tn : 56861} label="True Neg"  bg="rgba(0,153,255,0.1)"   color="#0099ff" />
                  </div>
                </div>
              </div>
            </div>

            {/* SHAP panel */}
            <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
                Top Fraud-Predicting Features (SHAP)
              </div>
              {shapFeatures.length > 0 ? (
                <ShapChart features={shapFeatures} maxBars={7} />
              ) : (
                <div>
                  {/* Static demo SHAP from training notebook when no history */}
                  <ShapChart features={[
                    { feature: "V17",    value:  0.89 },
                    { feature: "V14",    value:  0.82 },
                    { feature: "V12",    value:  0.75 },
                    { feature: "V10",    value:  0.61 },
                    { feature: "V11",    value: -0.45 },
                    { feature: "Amount", value:  0.38 },
                    { feature: "V4",     value: -0.29 },
                  ]} />
                  <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 10 }}>
                    * Demo data from training notebook. Run predictions to see live SHAP.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent prediction history table */}
          {history.length > 0 && (
            <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px", marginTop: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 18 }}>
                Prediction History ({history.length} records)
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["ID", "Amount", "Fraud Prob", "Verdict", "Timestamp"].map(h => (
                        <th key={h} style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a8d", padding: "0 12px 12px", textAlign: "left", fontWeight: 500 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.slice(0, 20).map(log => {
                      const color = log.fraud_prob >= 0.7 ? "#ff4757" : log.fraud_prob >= 0.4 ? "#ffa502" : "#2ed573";
                      return (
                        <tr key={log.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b7a8d" }}>TXN-{log.id}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13 }}>€{Number(log.amount || 0).toFixed(2)}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: 12, color }}>
                            {(log.fraud_prob * 100).toFixed(1)}%
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              fontSize: 11, padding: "3px 10px", borderRadius: 20,
                              background: log.is_fraud ? "rgba(255,71,87,0.1)" : "rgba(46,213,115,0.1)",
                              color:      log.is_fraud ? "#ff4757" : "#2ed573",
                            }}>
                              {log.is_fraud ? "⚠ Fraud" : "✓ Safe"}
                            </span>
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 11, color: "#6b7a8d" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
