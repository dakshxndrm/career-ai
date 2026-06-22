import React from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

export default function DashboardPrivate() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();

  const displayName =
    userData?.name || currentUser?.email?.split("@")[0] || "Explorer";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: "'Inter', sans-serif",
        color: C.ink,
      }}
    >
      <Navbar />

      <main
        style={{
          padding: "64px clamp(24px, 8vw, 72px)",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        {/* Welcome header */}
        <div style={{ marginBottom: 48 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.sage,
              marginBottom: 10,
            }}
          >
            Your Dashboard
          </p>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(28px, 5vw, 40px)",
              fontWeight: 900,
              color: C.ink,
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Welcome back,{" "}
            <span style={{ color: C.marigold }}>{displayName}</span>.
          </h1>
          <p style={{ color: C.muted, fontSize: 16, marginTop: 10 }}>
            Here is your career overview and next steps.
          </p>
        </div>

        {/* Cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {/* Current focus */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${C.mist}`,
              borderRadius: 18,
              padding: "28px 28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <IconBox>🗺</IconBox>
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 800,
                color: C.ink,
                margin: 0,
              }}
            >
              Current Focus
            </h3>
            <p style={{ fontSize: 15, color: C.ink, fontWeight: 500, margin: 0 }}>
              {userData?.role || "Role not set"}
            </p>
            <span
              style={{
                alignSelf: "flex-start",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: C.sage,
                background: `${C.sage}14`,
                padding: "4px 10px",
                borderRadius: 6,
              }}
            >
              Active path
            </span>
          </div>

          {/* Assessment CTA — ink hero card */}
          <div
            style={{
              background: C.ink,
              borderRadius: 18,
              padding: "28px 28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Mini topo rings */}
            <svg
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: -20,
                right: -20,
                opacity: 0.07,
                pointerEvents: "none",
              }}
              width="160"
              height="160"
              viewBox="0 0 160 160"
            >
              {[0,1,2,3].map((i) => (
                <circle key={i} cx="140" cy="140" r={25+i*25}
                  fill="none" stroke="#FAF8F3" strokeWidth="1" />
              ))}
            </svg>

            <IconBox dark>🧭</IconBox>
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 800,
                color: C.paper,
                margin: 0,
              }}
            >
              Career Assessment
            </h3>
            <p
              style={{
                fontSize: 14,
                color: C.mist,
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Complete your AI-driven evaluation to unlock personalised job
              matches and your full career roadmap.
            </p>
            <button
              onClick={() => navigate("/assessment")}
              style={{
                alignSelf: "flex-start",
                marginTop: 4,
                padding: "11px 22px",
                borderRadius: 12,
                border: "none",
                background: C.marigold,
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Continue Assessment →
            </button>
          </div>

          {/* Results shortcut (visible if role is set) */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${C.mist}`,
              borderRadius: 18,
              padding: "28px 28px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <IconBox>📋</IconBox>
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 800,
                color: C.ink,
                margin: 0,
              }}
            >
              Your Results
            </h3>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
              View your career report, top matches, and personal roadmap.
            </p>
            <button
              onClick={() => navigate("/results")}
              style={{
                alignSelf: "flex-start",
                padding: "10px 20px",
                borderRadius: 12,
                border: `1.5px solid ${C.ink}`,
                background: "transparent",
                color: C.ink,
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = C.ink;
                e.currentTarget.style.color = C.paper;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = C.ink;
              }}
            >
              View Report →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function IconBox({ children, dark }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: dark ? "rgba(250,248,243,0.12)" : C.mist,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}
