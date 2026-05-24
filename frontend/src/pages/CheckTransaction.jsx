import { useState } from "react";
import { predictTransaction } from "../api/client";

const FIELDS = [
  { key: "Amount", label: "Amount (€)",     placeholder: "e.g. 249.62" },
  { key: "Time",   label: "Time (seconds)", placeholder: "e.g. 406"    },
  { key: "V1",     label: "V1",             placeholder: "-1.359..."   },
  { key: "V2",     label: "V2",             placeholder: "-0.072..."   },
  { key: "V3",     label: "V3",             placeholder: "2.536..."    },
  { key: "V4",     label: "V4",             placeholder: "1.378..."    },
  { key: "V5",     label: "V5",             placeholder: "-0.338..."   },
  { key: "V6",     label: "V6",             placeholder: "0.462..."    },
];

const FRAUD_SAMPLE = {
  Amount: "2847.00", Time: "406",
  V1: "-3.043", V2: "-3.157", V3: "1.088",
  V4: "2.288",  V5: "1.359",  V6: "-0.675",
};
const SAFE_SAMPLE = {
  Amount: "89.50", Time: "3600",
  V1: "1.192", V2: "0.266", V3: "0.166",
  V4: "0.448", V5: "-0.060", V6: "0.210",
};

function riskColor(score) {
  if (score >= 70) return "#ff4757";
  if (score >= 40) return "#ffa502";
  return "#2ed573";
}

function riskLabel(score, isFraud) {
  if (score >= 70) return "⚠ Fraudulent";
  if (score >= 40) return "~ Suspicious";
  return "✓ Legitimate";
}

export default function CheckTransaction() {
  const [form,    setForm   ] = useState({});
  const [result,  setResult ] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState(null);

  const setField = (key) => (val) =>
    setForm((f) => ({ ...f, [key]: val }));

  const loadSample = (isFraud) => {
    setForm(isFraud ? FRAUD_SAMPLE : SAFE_SAMPLE);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!form.Amount) { setError("Amount is required."); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {};
      FIELDS.forEach(({ key }) => {
        payload[key] = parseFloat(form[key] || "0");
      });
      for (let i = 7; i <= 28; i++) payload[`V${i}`] = 0;
      const res = await predictTransaction(payload);
      setResult(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "#111820",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "10px 14px",
    color: "#e8edf2",
    fontFamily: "monospace",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 14,
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#6b7a8d",
    marginBottom: 5,
  };

  const btnSecondary = {
    padding: "8px 14px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    color: "#e8edf2",
    fontFamily: "sans-serif",
    fontSize: 12,
    cursor: "pointer",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: "#e8edf2" }}>
          Check Transaction
        </h1>
        <p style={{ color: "#6b7a8d", fontSize: 13, marginTop: 4 }}>
          Enter transaction features to get a real-time fraud prediction
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Input form ── */}
        <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#e8edf2", marginBottom: 18 }}>
            Transaction Features
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            {FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input
                  type="number"
                  step="any"
                  value={form[key] || ""}
                  placeholder={placeholder}
                  onChange={(e) => setField(key)(e.target.value)}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#6b7a8d", marginBottom: 14 }}>
            💡 V1–V28 are PCA-transformed features from the Kaggle dataset
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button style={btnSecondary} onClick={() => loadSample(false)}>
              Load Safe Sample
            </button>
            <button style={btnSecondary} onClick={() => loadSample(true)}>
              Load Fraud Sample
            </button>
          </div>

          {error && (
            <div style={{
              background: "rgba(255,71,87,0.08)",
              border: "1px solid rgba(255,71,87,0.2)",
              borderRadius: 8, padding: "10px 14px",
              color: "#ff6b78", fontSize: 12, marginBottom: 14,
            }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: 9, border: "none",
              background: loading ? "#1e2d3d" : "#00d4aa",
              color: loading ? "#6b7a8d" : "#060a0f",
              fontFamily: "sans-serif", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Analyzing…" : "🔍 Analyze Transaction"}
          </button>
        </div>

        {/* ── Result panel ── */}
        <div style={{
          background: "#131b24",
          border: `1px solid ${result
            ? result.is_fraud
              ? "rgba(255,71,87,0.3)"
              : "rgba(46,213,115,0.2)"
            : "rgba(255,255,255,0.07)"}`,
          borderRadius: 14, padding: "24px", minHeight: 400,
          display: "flex", flexDirection: "column",
          justifyContent: result ? "flex-start" : "center",
          alignItems: result ? "stretch" : "center",
        }}>
          {!result ? (
            <div style={{ textAlign: "center", color: "#6b7a8d" }}>
              <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>🛡️</div>
              <div style={{ fontSize: 13 }}>
                Enter transaction details<br />and click <strong>Analyze</strong>
              </div>
            </div>
          ) : (
            <>
              {/* Score display */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  fontFamily: "monospace", fontSize: 52, fontWeight: 700,
                  color: riskColor(result.risk_score),
                }}>
                  {result.risk_score}%
                </div>
                <div style={{
                  fontSize: 20, fontWeight: 800,
                  color: riskColor(result.risk_score), marginTop: 4,
                }}>
                  {riskLabel(result.risk_score)}
                </div>
                <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 6 }}>
                  Fraud probability · threshold {result.threshold_used ?? 0.5}
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                padding: "12px 16px", background: "rgba(255,255,255,0.03)",
                borderRadius: 10, fontSize: 12, color: "#6b7a8d", marginBottom: 20,
              }}>
                {[
                  ["Probability",   `${((result.fraud_probability ?? 0) * 100).toFixed(2)}%`],
                  ["Risk level",    result.risk_level ?? "—"],
                  ["Threshold",     result.threshold_used ?? 0.5],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span>{k}</span>
                    <span style={{ fontFamily: "monospace", color: "#e8edf2", textTransform: "capitalize" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* SHAP top features */}
              {result.top_features && result.top_features.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#6b7a8d", marginBottom: 10 }}>
                    Top Risk Factors (SHAP)
                  </div>
                  {result.top_features.map((f, i) => {
                    const isPos = f.value > 0;
                    const barColor = isPos ? "#ff4757" : "#2ed573";
                    const maxVal = Math.abs(result.top_features[0].value) || 1;
                    const pct = Math.round((Math.abs(f.value) / maxVal) * 100);
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6b7a8d", width: 48, textAlign: "right" }}>
                          {f.feature}
                        </span>
                        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: "monospace", fontSize: 10, color: barColor, width: 44 }}>
                          {isPos ? "+" : ""}{f.value.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => { setResult(null); setForm({}); }}
                  style={{ ...btnSecondary, flex: 1 }}
                >
                  Clear
                </button>
                <button
                  onClick={() => alert(`Transaction flagged for review!\nRisk: ${result.risk_score}%`)}
                  style={{ ...btnSecondary, flex: 1 }}
                >
                  Flag for Review
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const btnSecondary = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.04)",
  color: "#e8edf2",
  fontFamily: "sans-serif",
  fontSize: 12,
  cursor: "pointer",
};
