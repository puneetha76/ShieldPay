// frontend/src/pages/BatchUpload.jsx
import { useState, useRef } from "react";
import { batchPredict } from "../api/client";

const RISK_COLOR = (score) =>
  score >= 70 ? "#ff4757" : score >= 40 ? "#ffa502" : "#2ed573";

export default function BatchUpload() {
  const [file,     setFile    ] = useState(null);
  const [loading,  setLoading ] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result,   setResult  ] = useState(null);
  const [error,    setError   ] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) { setError("Only .csv files are supported."); return; }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);

    // Fake progress animation while waiting for API
    const iv = setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 12 : p));
    }, 200);

    try {
      const data = await batchPredict(file, 0.5);
      clearInterval(iv);
      setProgress(100);
      setResult(data);
    } catch (e) {
      clearInterval(iv);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!result) return;
    const header = "row,amount,risk_score,is_fraud,risk_level,top_feature";
    const rows = result.results.map((r) =>
      `${r.row},${r.amount ?? ""},${r.risk_score},${r.is_fraud},${r.risk_level},${r.top_feature}`
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "shieldpay_results.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", margin: 0 }}>
          Batch Upload
        </h1>
        <p style={{ color: "#6b7a8d", fontSize: 13, marginTop: 4 }}>
          Upload a CSV file with multiple transactions for bulk fraud scoring
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current.click()}
        style={{
          border: `2px dashed ${file ? "#00d4aa" : "rgba(255,255,255,0.13)"}`,
          borderRadius: 14,
          padding: "48px 32px",
          textAlign: "center",
          cursor: "pointer",
          background: file ? "rgba(0,212,170,0.03)" : "#131b24",
          transition: "all 0.2s",
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>📂</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#e8edf2", marginBottom: 4 }}>
          {file ? `✅ ${file.name}` : "Drop your CSV here, or click to browse"}
        </div>
        <div style={{ fontSize: 12, color: "#6b7a8d" }}>
          Kaggle credit card fraud dataset format · Max 500 rows processed
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          style={{ display: "none" }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>

      {/* Progress bar */}
      {loading && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7a8d", marginBottom: 6 }}>
            <span>{file?.name}</span>
            <span style={{ fontFamily: "'DM Mono', monospace" }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{
              width: `${progress}%`, height: "100%",
              background: "linear-gradient(90deg, #00d4aa, #0099ff)",
              borderRadius: 2, transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: "rgba(255,71,87,0.08)", border: "1px solid rgba(255,71,87,0.2)",
          borderRadius: 10, padding: "12px 16px", color: "#ff6b78",
          fontSize: 13, marginBottom: 20,
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Upload button */}
      {file && !result && (
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{
            padding: "12px 28px", borderRadius: 9, border: "none",
            background: loading ? "#1e2d3d" : "#00d4aa",
            color: loading ? "#6b7a8d" : "#060a0f",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            marginBottom: 24,
          }}
        >
          {loading ? "Processing…" : "🚀 Run Fraud Detection"}
        </button>
      )}

      {/* Results */}
      {result && (
        <div style={{ background: "#131b24", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "22px 24px" }}>
          {/* Summary row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Results — {result.total} transactions</div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(46,213,115,0.1)", color: "#2ed573", border: "1px solid rgba(46,213,115,0.2)" }}>
                ✓ {result.safe_count} Safe
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,71,87,0.1)", color: "#ff4757", border: "1px solid rgba(255,71,87,0.2)" }}>
                ⚠ {result.fraud_count} Fraud
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "rgba(255,165,2,0.1)", color: "#ffa502", border: "1px solid rgba(255,165,2,0.2)" }}>
                {result.fraud_rate}% rate
              </span>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Amount (€)", "Risk Score", "Verdict", "Risk Level", "Top Feature"].map((h) => (
                    <th key={h} style={{
                      fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
                      color: "#6b7a8d", padding: "0 12px 12px", textAlign: "left", fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => {
                  const color = RISK_COLOR(r.risk_score);
                  return (
                    <tr key={r.row} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "11px 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b7a8d" }}>
                        {r.row}
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 13 }}>
                        {r.amount != null ? `€${Number(r.amount).toFixed(2)}` : "—"}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                            <div style={{ width: `${r.risk_score}%`, height: "100%", background: color, borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color, minWidth: 36 }}>
                            {r.risk_score}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <span style={{
                          fontSize: 11, padding: "3px 10px", borderRadius: 20,
                          background: r.is_fraud ? "rgba(255,71,87,0.1)" : "rgba(46,213,115,0.1)",
                          color:      r.is_fraud ? "#ff4757" : "#2ed573",
                          border:     `1px solid ${r.is_fraud ? "rgba(255,71,87,0.2)" : "rgba(46,213,115,0.2)"}`,
                        }}>
                          {r.is_fraud ? "⚠ Fraud" : "✓ Safe"}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px", fontSize: 12, color: "#6b7a8d", textTransform: "capitalize" }}>
                        {r.risk_level}
                      </td>
                      <td style={{ padding: "11px 12px", fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#6b7a8d" }}>
                        {r.top_feature}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button onClick={downloadCSV} style={{
              padding: "9px 18px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "#e8edf2",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer",
            }}>
              ⬇ Download Results CSV
            </button>
            <button onClick={() => { setResult(null); setFile(null); setProgress(0); }} style={{
              padding: "9px 18px", borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.04)", color: "#e8edf2",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer",
            }}>
              Upload Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
