import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function QuizInstructions() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <main style={{ padding: "64px 96px", maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 36, marginBottom: 16 }}>
          Career Assessment Instructions
        </h1>

        <p style={{ fontSize: 18, marginBottom: 32 }}>
          This assessment is designed to understand your interests, personality,
          values, and strengths. Answer honestly — there are no right or wrong
          answers.
        </p>

        <ul style={{ lineHeight: 1.8, marginBottom: 40 }}>
          <li>Approx. 20–25 minutes</li>
          <li>MCQ + short text questions</li>
          <li>Quiz adapts based on your answers</li>
          <li>You can pause and continue later</li>
        </ul>

        <button
          onClick={() => navigate("/assessment")}
          style={{
            padding: "14px 28px",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 12,
            border: "none",
            background: "#2563eb",
            color: "white",
            cursor: "pointer",
          }}
        >
          Start Assessment →
        </button>
      </main>
    </>
  );
}
