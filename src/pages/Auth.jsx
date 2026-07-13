import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser, signInWithGoogle } from "../auth";
import { C, font } from "../theme";

export default function Auth() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin]   = useState(true);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    try {
      isLogin ? await loginUser(email, password) : await signupUser(email, password, "student");
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/profile");
    } catch (err) {
      setError(err.message || "Google sign-in failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="page-enter">
      <style>{`
        .auth-card { display:flex; min-height:100vh; background:${C.paper}; font-family:${font.body}; }
        .auth-brand { display:flex; flex-direction:column; justify-content:center; padding:52px 48px; background:${C.ink}; width:420px; flex-shrink:0; position:relative; overflow:hidden; }
        .auth-form-panel { flex:1; display:flex; align-items:center; justify-content:center; padding:40px 32px; min-width:0; }
        @media(max-width:720px){
          .auth-card { flex-direction:column; }
          .auth-brand { width:100%; padding:40px 28px 32px; }
          .auth-form-panel { padding:32px 20px 48px; align-items:flex-start; }
        }
        .auth-input { width:100%; padding:12px 14px; border-radius:10px; border:1.5px solid ${C.mist}; background:${C.paper}; color:${C.ink}; font-size:15px; font-family:${font.body}; outline:none; box-sizing:border-box; transition:border-color .15s; }
        .auth-input:focus { border-color:${C.marigold}; }
        .auth-tab { flex:1; padding:10px; border:none; background:transparent; font-family:${font.body}; font-size:14px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; color:${C.muted}; transition:color .15s, border-color .15s; }
        .auth-tab.active { color:${C.ink}; border-bottom-color:${C.marigold}; }
        .auth-tab:focus-visible { outline:3px solid ${C.marigold}; outline-offset:2px; }
        .auth-btn-primary { width:100%; padding:13px; border-radius:12px; border:none; background:${C.marigold}; color:#fff; font-family:${font.body}; font-size:15px; font-weight:700; cursor:pointer; transition:opacity .15s; }
        .auth-btn-primary:hover:not(:disabled){ opacity:.88; }
        .auth-btn-primary:disabled{ opacity:.55; cursor:not-allowed; }
        .auth-btn-primary:focus-visible{ outline:3px solid ${C.marigold}; outline-offset:2px; }
        .auth-btn-google { width:100%; padding:12px; border-radius:12px; border:1.5px solid ${C.mist}; background:#fff; color:${C.ink}; font-family:${font.body}; font-size:14px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:border-color .15s; }
        .auth-btn-google:hover:not(:disabled){ border-color:${C.marigold}; }
        .auth-btn-google:disabled{ opacity:.55; cursor:not-allowed; }
        .auth-btn-google:focus-visible{ outline:3px solid ${C.marigold}; outline-offset:2px; }
      `}</style>

      <div className="auth-card">
        {/* ── LEFT: Brand panel ── */}
        <div className="auth-brand">
          {/* Topo contour bg */}
          <svg aria-hidden="true" style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }} viewBox="0 0 420 600" preserveAspectRatio="xMidYMid slice">
            {[0,1,2,3,4].map((i) => (
              <ellipse key={`a${i}`} cx="80"  cy="480" rx={70+i*55}  ry={40+i*32} fill="none" stroke={C.paper} strokeWidth=".8" opacity={.06-i*.01} transform="rotate(-15 80 480)" />
            ))}
            {[0,1,2,3].map((i) => (
              <ellipse key={`b${i}`} cx="360" cy="100" rx={60+i*50}  ry={35+i*28} fill="none" stroke={C.paper} strokeWidth=".8" opacity={.05-i*.01} transform="rotate(10 360 100)" />
            ))}
          </svg>

          {/* Wordmark */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:40, position:"relative" }}>
            <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="10" stroke={C.marigold} strokeWidth="1.5"/>
              <circle cx="11" cy="11" r="6"  stroke={C.paper}    strokeWidth="1"   strokeDasharray="2 2"/>
              <circle cx="11" cy="11" r="2"  fill={C.marigold}/>
              <line x1="11" y1="1"  x2="11" y2="5"  stroke={C.paper} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="11" y1="17" x2="11" y2="21" stroke={C.paper} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="1"  y1="11" x2="5"  y2="11" stroke={C.paper} strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="17" y1="11" x2="21" y2="11" stroke={C.paper} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily:font.display, fontSize:20, fontWeight:800, color:C.paper, letterSpacing:"-.01em" }}>Career Atlas</span>
          </div>

          <h1 style={{ fontFamily:font.display, fontSize:"clamp(28px,4vw,40px)", fontWeight:900, color:C.paper, margin:"0 0 16px", lineHeight:1.08, position:"relative" }}>
            Chart your course.
          </h1>
          <p style={{ fontSize:15, color:C.mist, lineHeight:1.7, margin:"0 0 32px", position:"relative" }}>
            Discover careers aligned with who you are, then follow a personalised path to get there.
          </p>

          <div style={{ display:"flex", flexDirection:"column", gap:12, position:"relative" }}>
            {[
              { icon:"🧭", text:"AI-powered career assessment" },
              { icon:"🗺️", text:"Personalised learning roadmap" },
              { icon:"📈", text:"Track progress + daily streak" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }} aria-hidden="true">{icon}</span>
                <span style={{ fontSize:14, color:C.mist, fontWeight:500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="auth-form-panel">
          <div style={{ width:"100%", maxWidth:400 }}>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:".14em", textTransform:"uppercase", color:C.sage, margin:"0 0 10px" }}>
              {isLogin ? "Welcome back" : "Get started"}
            </p>
            <h2 style={{ fontFamily:font.display, fontSize:"clamp(22px,3vw,28px)", fontWeight:900, color:C.ink, margin:"0 0 28px", lineHeight:1.1 }}>
              {isLogin ? "Log in to your account." : "Create your account."}
            </h2>

            {/* Tab toggle */}
            <div style={{ display:"flex", borderBottom:`2px solid ${C.mist}`, marginBottom:28 }}>
              <button className={`auth-tab${isLogin  ? " active" : ""}`} onClick={() => { setIsLogin(true);  setError(""); }}>Log in</button>
              <button className={`auth-tab${!isLogin ? " active" : ""}`} onClick={() => { setIsLogin(false); setError(""); }}>Sign up</button>
            </div>

            {/* Email */}
            <div style={{ marginBottom:14 }}>
              <label htmlFor="auth-email" style={labelStyle}>Email address</label>
              <input id="auth-email" className="auth-input" type="email" autoComplete="email"
                placeholder="you@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </div>

            {/* Password */}
            <div style={{ marginBottom:20 }}>
              <label htmlFor="auth-password" style={labelStyle}>Password</label>
              <input id="auth-password" className="auth-input" type="password" autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            </div>

            {/* Inline error */}
            {error && (
              <p style={{ fontSize:13, color:"#c0392b", background:"#c0392b14", border:"1px solid #c0392b33", borderRadius:8, padding:"9px 12px", marginBottom:16, lineHeight:1.5 }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button className="auth-btn-primary" onClick={handleSubmit} disabled={loading}>
              {loading ? "Please wait…" : isLogin ? "Log in" : "Create account"}
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:10, margin:"18px 0 14px" }}>
              <span style={{ flex:1, height:1, background:C.mist }} />
              <span style={{ fontSize:12, color:C.muted, whiteSpace:"nowrap" }}>or</span>
              <span style={{ flex:1, height:1, background:C.mist }} />
            </div>

            {/* Google */}
            <button className="auth-btn-google" onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink:0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: ".10em",
  textTransform: "uppercase",
  color: C.muted,
  marginBottom: 6,
};
