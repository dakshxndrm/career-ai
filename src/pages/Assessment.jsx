import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import questions from "../data/questions";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Assessment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      const ref = doc(db, "assessments", currentUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setAnswers(data.answers || {});
        setCurrentIndex(data.lastQuestionIndex || 0);
      }

      setLoading(false);
    };

    loadProgress();
  }, [currentUser.uid]);

  const totalQuestions = questions.length;
  const question = questions[currentIndex];
  const progressPercent = Math.round(
    ((currentIndex + 1) / totalQuestions) * 100
  );

  const saveProgress = async (updatedAnswers, index) => {
    await setDoc(
      doc(db, "assessments", currentUser.uid),
      {
        answers: updatedAnswers,
        lastQuestionIndex: index,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  };

  const handleAnswer = async (value) => {
    const updatedAnswers = {
      ...answers,
      [question.id]: value,
    };

    const nextIndex = currentIndex + 1;

    setAnswers(updatedAnswers);
    await saveProgress(updatedAnswers, nextIndex);

    if (nextIndex >= totalQuestions) {
      navigate("/assessment/review");
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrevious = async () => {
    if (currentIndex === 0) return;
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    await saveProgress(answers, prevIndex);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={{ padding: 80, textAlign: "center" }}>
          <h2>Loading assessment…</h2>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main style={{ padding: "48px 96px", maxWidth: 900, margin: "0 auto" }}>
        {/* PROGRESS */}
        <div style={{ marginBottom: 32 }}>
          <div style={progressHeader}>
            <span>
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span>{progressPercent}% completed</span>
          </div>

          <div style={progressTrack}>
            <div
              style={{
                ...progressFill,
                width: `${progressPercent}%`,
              }}
            />
          </div>
        </div>

        {/* QUESTION */}
        <div style={cardStyle}>
          <h2 style={{ marginBottom: 24 }}>{question.question}</h2>

          {question.type === "mcq" &&
            question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                style={optionStyle}
              >
                {opt}
              </button>
            ))}

          {question.type === "text" && (
            <>
              <textarea
                defaultValue={answers[question.id] || ""}
                placeholder={question.placeholder}
                style={textAreaStyle}
                onBlur={(e) => handleAnswer(e.target.value)}
              />
              <p style={{ fontSize: 12, color: "#64748b" }}>
                Click outside to continue
              </p>
            </>
          )}

          <div style={{ marginTop: 32 }}>
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              style={secondaryBtn}
            >
              ← Previous
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

/* STYLES */
const progressHeader = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

const progressTrack = {
  width: "100%",
  height: 8,
  background: "#e5e7eb",
  borderRadius: 999,
};

const progressFill = {
  height: "100%",
  background: "linear-gradient(90deg, #0d9488, #3b82f6)",
  borderRadius: 999,
};

const cardStyle = {
  padding: 32,
  borderRadius: 20,
  background: "white",
  border: "1px solid #e2e8f0",
};

const optionStyle = {
  display: "block",
  width: "100%",
  padding: "14px 20px",
  marginBottom: 12,
  textAlign: "left",
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "transparent",
  cursor: "pointer",
};

const textAreaStyle = {
  width: "100%",
  minHeight: 120,
  padding: 14,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
};

const secondaryBtn = {
  padding: "12px 24px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  cursor: "pointer",
};
