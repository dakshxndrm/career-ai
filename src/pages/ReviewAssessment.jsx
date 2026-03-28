import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import questions from "../data/questions";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function ReviewAssessment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnswers = async () => {
      const ref = doc(db, "assessments", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setAnswers(snap.data().answers || {});
      }

      setLoading(false);
    };

    loadAnswers();
  }, [currentUser.uid]);

  const handleSubmit = async () => {
    await setDoc(
      doc(db, "assessments", currentUser.uid),
      {
        status: "completed",
        completedAt: new Date(),
      },
      { merge: true }
    );

    alert("Assessment submitted successfully!");
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ padding: 80, textAlign: "center" }}>
          <h2>Loading your answers…</h2>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main style={{ padding: "64px 96px", maxWidth: 1000, margin: "0 auto" }}>
        <h1>Review Your Answers</h1>
        <p style={{ marginBottom: 32 }}>
          Please review your responses before final submission.
        </p>

        {questions.map((q, i) => (
          <div key={q.id} style={cardStyle}>
            <strong>
              {i + 1}. {q.question}
            </strong>
            <p style={{ marginTop: 8, color: "#334155" }}>
              {answers[q.id] || "No answer provided"}
            </p>
          </div>
        ))}

        <button onClick={handleSubmit} style={submitBtn}>
          Submit Assessment ✅
        </button>
      </main>
    </>
  );
}

/* STYLES */
const cardStyle = {
  padding: 24,
  borderRadius: 16,
  border: "1px solid #e2e8f0",
  background: "white",
  marginBottom: 20,
};

const submitBtn = {
  marginTop: 40,
  padding: "16px 32px",
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #0d9488, #3b82f6)",
  color: "white",
  cursor: "pointer",
};
