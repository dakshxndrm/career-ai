import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

const BULLETS = [
  { icon: "⏱", text: "Takes about 20–25 minutes to complete." },
  { icon: "↔", text: "Mix of multiple-choice and short text questions." },
  { icon: "🧭", text: "Quiz adapts in real time based on your answers." },
  { icon: "⏸", text: "You can pause and your progress is saved automatically." },
];

export default function QuizInstructions() {
  const navigate = useNavigate();

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
          maxWidth: 680,
          margin: "0 auto",
          padding: "72px clamp(24px, 6vw, 96px) 80px",
        }}
      >
        {/* Eyebrow */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.sage,
            marginBottom: 14,
          }}
        >
          Step 2 of 3 — Assessment
        </p>

        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(28px, 5vw, 40px)",
            fontWeight: 900,
            color: C.ink,
            margin: "0 0 16px",
            lineHeight: 1.1,
          }}
        >
          Before you begin.
        </h1>

        <p
          style={{
            fontSize: 17,
            color: C.muted,
            lineHeight: 1.7,
            marginBottom: 40,
            maxWidth: 540,
          }}
        >
          This assessment is designed to understand your interests, personality,
          values, and strengths. Answer honestly — there are no right or wrong
          answers, only yours.
        </p>

        {/* Instruction cards */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 48,
          }}
        >
          {BULLETS.map(({ icon, text }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "16px 20px",
                background: "#fff",
                border: `1px solid ${C.mist}`,
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `${C.marigold}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                  color: C.marigold,
                  fontStyle: "normal",
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: C.ink }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/assessment")}
          style={{
            padding: "14px 36px",
            borderRadius: 12,
            border: "none",
            background: C.marigold,
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          onFocus={(e) =>
            (e.currentTarget.style.outline = `3px solid ${C.marigold}`)
          }
          onBlur={(e) => (e.currentTarget.style.outline = "none")}
        >
          Start Assessment →
        </button>
      </main>
    </div>
  );
}
