import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Assessment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [error, setError] = useState(null);

  // Step 1: Load user profile from Firebase, then ask AI to generate questions
  useEffect(() => {
    const generateQuestions = async () => {
      try {
        // Get user profile
        const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
        const profile = profileSnap.exists() ? profileSnap.data() : {};

        // Ask Claude AI to generate personalized questions
        const prompt = `You are a career assessment expert. Based on this user's profile, generate exactly 10 multiple choice questions to deeply understand their strengths, weaknesses, personality, and interests so you can suggest the perfect career for them.

User Profile:
- Name: ${profile.name || "Unknown"}
- Age: ${profile.age || "Unknown"}
- Role: ${profile.role || "Unknown"}
- Phone: ${profile.phone || "Unknown"}

Rules:
- Each question must have exactly 4 options
- Questions should cover: interests, personality, work style, strengths, values, skills, motivation
- Make questions specific and insightful, not generic
- Return ONLY a valid JSON array, no extra text, no markdown, no explanation

Format:
[
  {
    "id": "Q1",
    "question": "Your question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"]
  }
]`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();
        const text = data.content[0].text;

        // Clean and parse JSON
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Save questions to Firebase so we don't regenerate on refresh
        await setDoc(
          doc(db, "assessments", currentUser.uid),
          { questions: parsed, answers: {}, lastQuestionIndex: 0, updatedAt: new Date() },
          { merge: true }
        );

        setQuestions(parsed);
        setLoadingQuestions(false);
      } catch (err) {
        console.error("Error generating questions:", err);
        setError("Something went wrong. Please try again.");
        setLoadingQuestions(false);
      }
    };

    // Check if questions already exist in Firebase (avoid regenerating)
    const loadOrGenerate = async () => {
      const snap = await getDoc(doc(db, "assessments", currentUser.uid));
      if (snap.exists() && snap.data().questions?.length > 0) {
        const data = snap.data();
        setQuestions(data.questions);
        setAnswers(data.answers || {});
        setCurrentIndex(data.lastQuestionIndex || 0);
        setLoadingQuestions(false);
      } else {
        await generateQuestions();
      }
    };

    loadOrGenerate();
  }, [currentUser.uid]);

  const saveProgress = async (updatedAnswers, index) => {
    await setDoc(
      doc(db, "assessments", currentUser.uid),
      { answers: updatedAnswers, lastQuestionIndex: index, updatedAt: new Date() },
      { merge: true }
    );
  };

  const handleAnswer = async (value) => {
    const question = questions[currentIndex];
    const updatedAnswers = { ...answers, [question.id]: value };
    const nextIndex = currentIndex + 1;

    setAnswers(updatedAnswers);
    await saveProgress(updatedAnswers, nextIndex);

    if (nextIndex >= questions.length) {
      navigate("/results");
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

  // Loading screen while AI generates questions
  if (loadingQuestions) {
    return (
      <>
        <Navbar />
        <main style={styles.centered}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <h2 style={styles.loadingTitle}>Personalizing your assessment...</h2>
            <p style={styles.loadingText}>
              Our AI is crafting questions specifically for you. This takes about 10 seconds.
            </p>
          </div>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main style={styles.centered}>
          <div style={styles.loadingCard}>
            <p style={{ color: "red" }}>{error}</p>
            <button onClick={() => window.location.reload()} style={styles.btn}>
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  const question = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <>
      <Navbar />
      <main style={styles.main}>
        {/* Progress Bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={styles.progressHeader}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{progressPercent}% completed</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div style={styles.card}>
          <h2 style={styles.questionText}>{question.question}</h2>

          <div style={{ marginTop: 24 }}>
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                style={{
                  ...styles.optionBtn,
                  background: answers[question.id] === opt ? "#e0fdf4" : "transparent",
                  borderColor: answers[question.id] === opt ? "#0d9488" : "#e2e8f0",
                }}
              >
                <span style={styles.optionLetter}>
                  {["A", "B", "C", "D"][i]}
                </span>
                {opt}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={styles.prevBtn}
          >
            ← Previous
          </button>
        </div>
      </main>
    </>
  );
}

const styles = {
  main: {
    padding: "48px 24px",
    maxWidth: 720,
    margin: "0 auto",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "80vh",
  },
  loadingCard: {
    textAlign: "center",
    padding: 48,
    background: "white",
    borderRadius: 20,
    border: "1px solid #e2e8f0",
    maxWidth: 420,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 12,
    color: "#0f172a",
  },
  loadingText: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #0d9488",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 24px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: "#64748b",
  },
  progressTrack: {
    width: "100%",
    height: 8,
    background: "#e5e7eb",
    borderRadius: 999,
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #0d9488, #3b82f6)",
    borderRadius: 999,
    transition: "width 0.4s ease",
  },
  card: {
    padding: 32,
    borderRadius: 20,
    background: "white",
    border: "1px solid #e2e8f0",
  },
  questionText: {
    fontSize: 20,
    fontWeight: 700,
    color: "#0f172a",
    lineHeight: 1.5,
  },
  optionBtn: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "14px 20px",
    marginBottom: 12,
    textAlign: "left",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    cursor: "pointer",
    fontSize: 15,
    transition: "all 0.2s",
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: "50%",
    background: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 13,
    color: "#0d9488",
    flexShrink: 0,
  },
  prevBtn: {
    marginTop: 24,
    padding: "10px 20px",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    cursor: "pointer",
    fontSize: 14,
  },
  btn: {
    marginTop: 16,
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    background: "#0d9488",
    color: "white",
    cursor: "pointer",
    fontSize: 15,
  },
};