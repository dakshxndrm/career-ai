import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signupUser,
  loginUser,
  signInWithGoogle,
} from "../auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

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

  /* ---------- GOOGLE LOGIN ---------- */
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

  /* ---------- DUMMY LOGIN (DEV MODE) ---------- */
  const handleDummyLogin = async () => {
    const dummyUserId = "dummy-user";

    await setDoc(doc(db, "users", dummyUserId), {
      email: "demo@careerai.dev",
      role: "student",
      onboardingCompleted: false,
      provider: "dummy",
    });

    navigate("/profile");

  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #020617, #0f172a, #020617)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 32px",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        {/* BRAND */}
        <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8 }}>
          Career AI
        </h1>
        <p style={{ color: "#94a3b8", marginBottom: 40 }}>
          Your personalised career compass
        </p>

        {/* AUTH BOX */}
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: 32,
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <h2 style={{ marginBottom: 8 }}>
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>

          <p style={{ color: "#94a3b8", marginBottom: 24 }}>
            {isLogin
              ? "Log in to continue your career journey"
              : "Start discovering careers aligned with who you are"}
          </p>

          <input
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
            style={inputStyle}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={primaryBtn}
          >
            {loading
              ? "Please wait..."
              : isLogin
              ? "Login"
              : "Create account"}
          </button>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={secondaryBtn}
          >
            Continue with Google
          </button>

          <button
            onClick={handleDummyLogin}
            style={{
              ...secondaryBtn,
              border: "1px dashed rgba(255,255,255,0.3)",
            }}
          >
            Skip Login (Demo Mode)
          </button>

          <p
            onClick={() => setIsLogin(!isLogin)}
            style={{
              marginTop: 20,
              textAlign: "center",
              cursor: "pointer",
              color: "#60a5fa",
              fontSize: 14,
            }}
          >
            {isLogin
              ? "New here? Create an account"
              : "Already have an account? Login"}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  marginBottom: 14,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: 14,
};

const primaryBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
  border: "none",
  color: "white",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  marginTop: 8,
};

const secondaryBtn = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.25)",
  color: "white",
  fontSize: 14,
  cursor: "pointer",
  marginTop: 12,
};
