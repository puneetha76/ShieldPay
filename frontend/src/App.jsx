import { useState } from "react";
import Login            from "./pages/Login";
import Dashboard        from "./pages/Dashboard";
import CheckTransaction from "./pages/CheckTransaction";
import BatchUpload      from "./pages/BatchUpload";
import Reports          from "./pages/Reports";

const NAV = [
  { id: "dashboard", icon: "📊", label: "Dashboard"         },
  { id: "check",     icon: "🔍", label: "Check Transaction" },
  { id: "batch",     icon: "📂", label: "Batch Upload"      },
  { id: "reports",   icon: "📈", label: "Reports"           },
];

function Sidebar({ active, onNav, user, onLogout }) {
  return (
    <aside style={{
      width: 220,
      minHeight: "100vh",
      background: "#0c1118",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      padding: "28px 0",
      position: "fixed",
      top: 0, left: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 24px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg, #00d4aa, #0099ff)",
            borderRadius: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>🛡️</div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>
            ShieldPay
          </span>
        </div>
        <div style={{ fontSize: 10, color: "#6b7a8d", letterSpacing: "2px", textTransform: "uppercase", paddingLeft: 46 }}>
          Fraud Intelligence
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 16px" }}>
        <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#6b7a8d", padding: "0 8px", marginBottom: 6 }}>
          Main
        </div>
        {NAV.map(({ id, icon, label }) => (
          <button key={id} onClick={() => onNav(id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 8, border: "none",
            background: active === id ? "rgba(0,212,170,0.1)" : "transparent",
            color: active === id ? "#00d4aa" : "#6b7a8d",
            fontFamily: "sans-serif", fontSize: 13.5,
            fontWeight: active === id ? 500 : 400,
            cursor: "pointer", width: "100%", textAlign: "left", marginBottom: 2,
          }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </nav>

      {/* User + logout */}
      <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Online status */}
        <div style={{ fontSize: 12, color: "#6b7a8d", marginBottom: 8 }}>
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: "#2ed573", marginRight: 6,
          }}/>
          Model Online
        </div>
        <div style={{ fontSize: 11, color: "#6b7a8d", fontFamily: "monospace", marginBottom: 12 }}>
          XGBoost v2.1 · AUC 0.987
        </div>

        {/* Logged-in user */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8, padding: "8px 12px", marginBottom: 8,
        }}>
          <div style={{ fontSize: 11, color: "#00d4aa", fontWeight: 600, marginBottom: 2 }}>
            👤 {user?.name || "Analyst"}
          </div>
          <div style={{ fontSize: 10, color: "#6b7a8d", wordBreak: "break-all" }}>
            {user?.email || ""}
          </div>
        </div>

        {/* Logout button */}
        <button onClick={onLogout} style={{
          width: "100%", padding: "7px", borderRadius: 7,
          border: "1px solid rgba(255,71,87,0.2)",
          background: "rgba(255,71,87,0.06)",
          color: "#ff4757", fontFamily: "sans-serif",
          fontSize: 12, cursor: "pointer",
        }}>
          ⏻ Sign Out
        </button>
      </div>
    </aside>
  );
}

function PageContent({ page }) {
  if (page === "dashboard") return <Dashboard />;
  if (page === "check")     return <CheckTransaction />;
  if (page === "batch")     return <BatchUpload />;
  if (page === "reports")   return <Reports />;
  return <Dashboard />;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  // Show login if not logged in
  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return (
    <div style={{
      display: "flex", minHeight: "100vh",
      background: "#060a0f", color: "#e8edf2", fontFamily: "sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0c1118; }
        ::-webkit-scrollbar-thumb { background: #1e2d3d; border-radius: 3px; }
      `}</style>

      <Sidebar active={page} onNav={setPage} user={user} onLogout={() => setUser(null)} />

      <main style={{ marginLeft: 220, flex: 1, padding: "32px 36px", minHeight: "100vh" }}>
        <PageContent page={page} />
      </main>
    </div>
  );
}
