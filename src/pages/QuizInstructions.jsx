import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

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

const GOALS = [
  {
    value: "career",
    label: "Build a career",
    desc: "Discover which careers match your strengths and interests.",
    icon: "🧭",
  },
  {
    value: "skill",
    label: "Learn a skill",
    desc: "Get a personalised roadmap for a specific skill you want to develop.",
    icon: "📚",
  },
];

export default function QuizInstructions() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [goal, setGoal] = useState("career");
  const [title, setTitle] = useState("");
  const [titleFocused, setTitleFocused] = useState(false);
  const [creating, setCreating] = useState(false);

  const titlePlaceholder =
    goal === "career" ? "e.g. Frontend Developer, Doctor, UX Designer" : "e.g. Learn Python, Master Public Speaking";

  const handleStart = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    setCreating(true);
    try {
      const id = crypto.randomUUID();
      const itemRef = doc(db, "assessments", currentUser.uid, "items", id);
      await setDoc(itemRef, {
        id,
        title: trimmed,
        goal,
        questions: [],
        answers: {},
        result: null,
        roadmap: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      navigate(`/assessment?id=${id}`);
    } catch (err) {
      console.error("QuizInstructions: failed to create item:", err);
      setCreating(false);
    }
  };

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
          padding: "64px clamp(20px, 6vw, 72px) 80px",
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
          Step 2 of 3 — Assessment setup
        </p>

        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(26px, 5vw, 38px)",
            fontWeight: 900,
            color: C.ink,
            margin: "0 0 14px",
            lineHeight: 1.1,
          }}
        >
          Set your goal.
        </h1>

        <p
          style={{
            fontSize: 16,
            color: C.muted,
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 500,
          }}
        >
          Tell us what you want to achieve. This shapes every question the AI asks.
        </p>

        {/* Goal selector */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
          {GOALS.map((g) => {
            const active = goal === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                style={{
                  flex: "1 1 200px",
                  padding: "18px 20px",
                  borderRadius: 14,
                  border: `2px solid ${active ? C.marigold : C.mist}`,
                  background: active ? `${C.marigold}10` : "#fff",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "'Inter', sans-serif",
                  transition: "border-color .15s, background .15s",
                }}
                onFocus={(e) => (e.currentTarget.style.outline = `3px solid ${C.marigold}`)}
                onBlur={(e) => (e.currentTarget.style.outline = "none")}
              >
                <div style={{ fontSize: 22, marginBottom: 8 }}>{g.icon}</div>
                <div
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: C.ink,
                    marginBottom: 4,
                  }}
                >
                  {g.label}
                </div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                  {g.desc}
                </div>
              </button>
            );
          })}
        </div>

        {/* Title input */}
        <div style={{ marginBottom: 32 }}>
          <label
            htmlFor="assessment-title"
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: titleFocused ? C.marigold : C.muted,
              marginBottom: 8,
              transition: "color .15s",
            }}
          >
            Give this assessment a title
          </label>
          <input
            id="assessment-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
            onKeyDown={(e) => e.key === "Enter" && title.trim() && handleStart()}
            placeholder={titlePlaceholder}
            maxLength={80}
            style={{
              width: "100%",
              padding: "13px 15px",
              borderRadius: 12,
              border: `1.5px solid ${titleFocused ? C.marigold : C.mist}`,
              background: C.paper,
              color: C.ink,
              fontSize: 15,
              fontFamily: "'Inter', sans-serif",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color .15s",
            }}
          />
        </div>

        {/* Info bullets */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 40,
          }}
        >
          {BULLETS.map(({ icon, text }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 18px",
                background: "#fff",
                border: `1px solid ${C.mist}`,
                borderRadius: 12,
              }}
            >
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: `${C.marigold}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {icon}
              </span>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: C.ink }}>
                {text}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={!title.trim() || creating}
          style={{
            padding: "14px 36px",
            borderRadius: 12,
            border: "none",
            background:
              !title.trim() || creating ? `${C.marigold}66` : C.marigold,
            color: "#fff",
            fontFamily: "'Inter', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            cursor: !title.trim() || creating ? "not-allowed" : "pointer",
            transition: "opacity .15s",
          }}
          onMouseOver={(e) => {
            if (title.trim() && !creating) e.currentTarget.style.opacity = "0.88";
          }}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          onFocus={(e) =>
            (e.currentTarget.style.outline = `3px solid ${C.marigold}`)
          }
          onBlur={(e) => (e.currentTarget.style.outline = "none")}
        >
          {creating ? "Setting up…" : "Start Assessment →"}
        </button>
      </main>
    </div>
  );
}
