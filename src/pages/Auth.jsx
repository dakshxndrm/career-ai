import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, loginUser, signInWithGoogle } from "../auth";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /* ---------- EMAIL / PASSWORD ---------- */
  const handleSubmit = async () => {
    if (!email || !password) {
      alert("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        await signupUser(email, password, "student");
      }
      navigate("/profile");
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  /* ---------- GOOGLE ---------- */
  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate("/profile");
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Faint topo rings behind the card */}
      <svg
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.05 }}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {[0,1,2,3,4,5].map((i) => (
          <ellipse key={i} cx="400" cy="300" rx={80+i*70} ry={50+i*45}
            fill="none" stroke={C.paper} strokeWidth="1" />
        ))}
      </svg>

      {/* Wordmark */}
      <div style={{ marginBottom: 36, textAlign: "center", position: "relative" }}>
        <span
          style={{
            display: "block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.marigold,
            marginBottom: 8,
          }}
        >
          Career Atlas
        </span>
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(28px, 5vw, 38px)",
            fontWeight: 900,
            color: C.paper,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {isLogin ? "Welcome back." : "Chart your course."}
        </h1>
        <p style={{ color: C.muted, marginTop: 10, fontSize: 15 }}>
          {isLogin
            ? "Log in to continue your career journey."
            : "Start discovering careers aligned with who you are."}
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: "rgba(250,248,243,0.06)",
          border: `1px solid rgba(232,228,218,0.18)`,
          borderRadius: 18,
          padding: "32px 28px",
        }}
      >
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ ...inputStyle, marginBottom: 20 }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />

        {/* Primary: marigold */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            borderRadius: 12,
            border: "none",
            background: loading ? `${C.marigold}99` : C.marigold,
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </button>

        <div style={dividerStyle}>
          <span style={dividerLine} />
          <span style={{ fontSize: 12, color: C.muted, whiteSpace: "nowrap" }}>or continue with</span>
          <span style={dividerLine} />
        </div>

        {/* Google — ink outline on dark */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={outlineBtn}
        >
          <GoogleIcon />
          Google
        </button>

        <p
          onClick={() => setIsLogin((v) => !v)}
          style={{
            marginTop: 22,
            textAlign: "center",
            cursor: "pointer",
            color: C.marigold,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {isLogin ? "New here? Create an account" : "Already have an account? Log in"}
        </p>
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ── Styles ── */

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  marginBottom: 12,
  borderRadius: 10,
  border: `1px solid rgba(232,228,218,0.22)`,
  background: "rgba(250,248,243,0.07)",
  color: "#FAF8F3",
  fontSize: 14,
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const outlineBtn = {
  width: "100%",
  padding: "12px",
  borderRadius: 12,
  border: `1.5px solid rgba(232,228,218,0.30)`,
  background: "transparent",
  color: "#FAF8F3",
  fontFamily: "'Inter', sans-serif",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
};

const dividerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "18px 0 14px",
};

const dividerLine = {
  display: "block",
  flex: 1,
  height: 1,
  background: "rgba(232,228,218,0.18)",
};
