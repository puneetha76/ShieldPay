import { useState } from "react";

export default function Login({ onLogin }) {
  const [tab,      setTab     ] = useState("login");
  const [email,    setEmail   ] = useState("");
  const [password, setPassword] = useState("");
  const [name,     setName    ] = useState("");
  const [confirm,  setConfirm ] = useState("");
  const [showPwd,  setShowPwd ] = useState(false);
  const [error,    setError   ] = useState("");
  const [loading,  setLoading ] = useState(false);

  const inputStyle = {
    width: "100%",
    background: "#0c1118",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9,
    padding: "11px 14px 11px 40px",
    color: "#e8edf2",
    fontFamily: "sans-serif",
    fontSize: 13.5,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const labelStyle = {
    display: "block",
    fontSize: 11,
    letterSpacing: "1px",
    textTransform: "uppercase",
    color: "#6b7a8d",
    marginBottom: 6,
  };

  const handleLogin = () => {
    setError("");
    if (!email)    { setError("Email is required.");    return; }
    if (!password) { setError("Password is required."); return; }
    if (password !== "demo123" && password.length < 6) {
      setError("Use password: demo123 for demo access.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ email, name: email.split("@")[0] });
    }, 1200);
  };

  const handleRegister = () => {
    setError("");
    if (!name)     { setError("Full name is required.");       return; }
    if (!email)    { setError("Email is required.");           return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match.");  return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin({ email, name });
    }, 1200);
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "#060a0f",
      color: "#e8edf2",
      fontFamily: "sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes gridMove { from{background-position:0 0} to{background-position:40px 40px} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pillIn   { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        .login-input:focus  { border-color: #00d4aa !important; box-shadow: 0 0 0 3px rgba(0,212,170,0.1); }
        .nav-tab:hover      { background: rgba(255,255,255,0.06) !important; }
        .submit-btn:hover   { opacity: 0.9; transform: translateY(-1px); }
        .submit-btn:active  { transform: translateY(0); }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: "45%",
        background: "#0c1118",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "48px 52px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Animated grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "linear-gradient(rgba(0,212,170,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,170,0.04) 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "gridMove 20s linear infinite",
        }}/>
        {/* Glow */}
        <div style={{
          position: "absolute", bottom: -120, left: -80,
          width: 500, height: 500, pointerEvents: "none",
          background: "radial-gradient(circle,rgba(0,212,170,0.08) 0%,transparent 70%)",
        }}/>

        {/* Brand */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
            <div style={{
              width: 44, height: 44,
              background: "linear-gradient(135deg,#00d4aa,#0099ff)",
              borderRadius: 12,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>🛡️</div>
            <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px" }}>ShieldPay</span>
          </div>

          <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 20 }}>
            Stop Fraud<br/>Before It<br/>
            <span style={{
              background: "linear-gradient(90deg,#00d4aa,#0099ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Strikes.</span>
          </div>
          <div style={{ fontSize: 14, color: "#6b7a8d", lineHeight: 1.7, maxWidth: 320 }}>
            Real-time ML-powered fraud intelligence for modern financial teams.
            Every transaction analyzed in milliseconds.
          </div>
        </div>

        {/* Stats pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative", zIndex: 1 }}>
          {[
            { icon: "⚡", val: "0.987",   lbl: "AUC-ROC Score"         },
            { icon: "🔍", val: "284,807", lbl: "Transactions analyzed" },
            { icon: "🛡️", val: "92.4%",  lbl: "Fraud recall rate"     },
          ].map((s, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 12, padding: "14px 18px",
              animation: `pillIn 0.5s ease ${0.1 + i * 0.1}s both`,
            }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 500, color: "#00d4aa" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#6b7a8d", marginTop: 1 }}>{s.lbl}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "48px 32px",
      }}>
        <div style={{
          width: "100%", maxWidth: 400,
          animation: "fadeUp 0.5s ease 0.1s both",
        }}>
          <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </div>
          <div style={{ fontSize: 13, color: "#6b7a8d", marginBottom: 32 }}>
            {tab === "login"
              ? "Sign in to your ShieldPay workspace"
              : "Join ShieldPay fraud intelligence"}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex", background: "#0c1118",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: 4, marginBottom: 28,
          }}>
            {["login", "register"].map((t) => (
              <button key={t} className="nav-tab" onClick={() => { setTab(t); setError(""); }}
                style={{
                  flex: 1, padding: "8px", borderRadius: 7, border: "none",
                  background: tab === t ? "#131b24" : "transparent",
                  color: tab === t ? "#e8edf2" : "#6b7a8d",
                  fontFamily: "sans-serif", fontSize: 13, fontWeight: 500,
                  cursor: "pointer",
                  border: tab === t ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                  transition: "all 0.2s",
                }}>
                {t === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div style={{
              background: "rgba(255,71,87,0.08)",
              border: "1px solid rgba(255,71,87,0.25)",
              borderRadius: 8, padding: "10px 14px",
              color: "#ff6b78", fontSize: 12.5, marginBottom: 16,
            }}>
              ⚠ {error}
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {tab === "login" && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Email address</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>✉️</span>
                  <input className="login-input" type="email" placeholder="analyst@shieldpay.io"
                    value={email} onChange={e => setEmail(e.target.value)}
                    style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Password</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>🔒</span>
                  <input className="login-input" type={showPwd ? "text" : "password"} placeholder="Enter your password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={inputStyle} />
                  <button onClick={() => setShowPwd(!showPwd)} style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "#6b7a8d", cursor: "pointer", fontSize: 12,
                  }}>{showPwd ? "Hide" : "Show"}</button>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, fontSize: 12.5 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, color: "#6b7a8d", cursor: "pointer" }}>
                  <input type="checkbox" defaultChecked style={{ accentColor: "#00d4aa" }} />
                  Remember me
                </label>
                <span style={{ color: "#00d4aa", cursor: "pointer", fontSize: 12.5 }}>Forgot password?</span>
              </div>

              <button className="submit-btn" onClick={handleLogin} disabled={loading} style={{
                width: "100%", padding: 13, borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#00d4aa,#0099ff)",
                color: "#060a0f", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Signing in…" : "Sign In to ShieldPay"}
              </button>

              <div style={{
                marginTop: 20, padding: "12px 16px",
                background: "rgba(0,212,170,0.05)",
                border: "1px solid rgba(0,212,170,0.15)",
                borderRadius: 9, fontSize: 12, color: "#6b7a8d",
              }}>
                🧪 <strong style={{ color: "#00d4aa", fontFamily: "monospace" }}>Demo:</strong> any email + password <strong style={{ color: "#00d4aa", fontFamily: "monospace" }}>demo123</strong>
              </div>
            </>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === "register" && (
            <>
              {[
                { label: "Full name",       icon: "👤", val: name,     set: setName,     type: "text",     ph: "Your full name"    },
                { label: "Email address",   icon: "✉️", val: email,    set: setEmail,    type: "email",    ph: "you@company.com"   },
                { label: "Password",        icon: "🔒", val: password, set: setPassword, type: "password", ph: "Min 6 characters"  },
                { label: "Confirm password",icon: "🔒", val: confirm,  set: setConfirm,  type: "password", ph: "Repeat password"   },
              ].map(({ label, icon, val, set, type, ph }) => (
                <div key={label} style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4 }}>{icon}</span>
                    <input className="login-input" type={type} placeholder={ph}
                      value={val} onChange={e => set(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleRegister()}
                      style={inputStyle} />
                  </div>
                </div>
              ))}

              <button className="submit-btn" onClick={handleRegister} disabled={loading} style={{
                width: "100%", padding: 13, borderRadius: 10, border: "none",
                background: "linear-gradient(135deg,#00d4aa,#0099ff)",
                color: "#060a0f", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.15s", opacity: loading ? 0.7 : 1,
                marginTop: 4,
              }}>
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
