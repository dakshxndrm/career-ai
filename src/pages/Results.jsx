import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Results() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateResult = async () => {
      try {
        // Load profile + answers from Firebase
        const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
        const assessSnap = await getDoc(doc(db, "assessments", currentUser.uid));

        const profile = profileSnap.exists() ? profileSnap.data() : {};
        const assessData = assessSnap.exists() ? assessSnap.data() : {};

        // If result already exists, just show it
        if (assessData.result) {
          setResult(assessData.result);
          setLoading(false);
          return;
        }

        const questions = assessData.questions || [];
        const answers = assessData.answers || {};

        // Build Q&A summary for AI
        const qaSummary = questions
          .map((q) => `Q: ${q.question}\nA: ${answers[q.id] || "Not answered"}`)
          .join("\n\n");

        const prompt = `You are an expert career counselor. Based on this user's profile and quiz answers, analyze them deeply and give a personalized career report.

User Profile:
- Name: ${profile.name || "Unknown"}
- Age: ${profile.age || "Unknown"}
- Role: ${profile.role || "Unknown"}

Quiz Answers:
${qaSummary}

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "topCareers": [
    { "title": "Career Name", "match": 95, "reason": "2-3 sentence explanation why this fits them" },
    { "title": "Career Name", "match": 85, "reason": "2-3 sentence explanation" },
    { "title": "Career Name", "match": 75, "reason": "2-3 sentence explanation" }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "skillsToLearn": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "roadmap": [
    { "step": 1, "title": "Step title", "description": "What to do in this step" },
    { "step": 2, "title": "Step title", "description": "What to do in this step" },
    { "step": 3, "title": "Step title", "description": "What to do in this step" },
    { "step": 4, "title": "Step title", "description": "What to do in this step" }
  ],
  "personalityType": "2-3 word personality label",
  "summary": "2-3 sentence overall summary of this person"
}`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await response.json();
        const text = data.content[0].text;
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Save result to Firebase
        await setDoc(
          doc(db, "assessments", currentUser.uid),
          { result: parsed, completedAt: new Date() },
          { merge: true }
        );

        setResult(parsed);
        setLoading(false);
      } catch (err) {
        console.error("Error generating result:", err);
        setError("Something went wrong generating your results. Please try again.");
        setLoading(false);
      }
    };

    generateResult();
  }, [currentUser.uid]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main style={styles.centered}>
          <div style={styles.loadingCard}>
            <div style={styles.spinner} />
            <h2 style={styles.loadingTitle}>Analyzing your responses...</h2>
            <p style={styles.loadingText}>
              Our AI is building your personalized career report. This takes about 15 seconds.
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
            <p style={{ color: "red", marginBottom: 16 }}>{error}</p>
            <button onClick={() => window.location.reload()} style={styles.primaryBtn}>
              Try Again
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={styles.main}>

        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.headerTitle}>Your Career Report</h1>
          <p style={styles.headerSubtitle}>{result.summary}</p>
          <span style={styles.personalityBadge}>{result.personalityType}</span>
        </div>

        {/* Top Career Matches */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🎯 Top Career Matches</h2>
          <div style={styles.careerGrid}>
            {result.topCareers.map((career, i) => (
              <div key={i} style={{ ...styles.careerCard, borderColor: i === 0 ? "#0d9488" : "#e2e8f0" }}>
                {i === 0 && <span style={styles.bestMatchBadge}>Best Match</span>}
                <h3 style={styles.careerTitle}>{career.title}</h3>
                <div style={styles.matchBarWrapper}>
                  <div style={{ ...styles.matchBarFill, width: `${career.match}%` }} />
                </div>
                <span style={styles.matchPercent}>{career.match}% match</span>
                <p style={styles.careerReason}>{career.reason}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Strengths */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>💪 Your Strengths</h2>
          <div style={styles.tagsRow}>
            {result.strengths.map((s, i) => (
              <span key={i} style={styles.strengthTag}>{s}</span>
            ))}
          </div>
        </section>

        {/* Skills to Learn */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>📚 Skills to Learn</h2>
          <div style={styles.tagsRow}>
            {result.skillsToLearn.map((s, i) => (
              <span key={i} style={styles.skillTag}>{s}</span>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>🛣️ Your Roadmap</h2>
          <div style={styles.roadmap}>
            {result.roadmap.map((step, i) => (
              <div key={i} style={styles.roadmapStep}>
                <div style={styles.stepNumber}>{step.step}</div>
                <div style={styles.stepContent}>
                  <h3 style={styles.stepTitle}>{step.title}</h3>
                  <p style={styles.stepDesc}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Retake Button */}
        <div style={{ textAlign: "center", marginTop: 48, marginBottom: 64 }}>
          <button
            onClick={async () => {
              await setDoc(
                doc(db, "assessments", currentUser.uid),
                { questions: [], answers: {}, result: null, lastQuestionIndex: 0 },
                { merge: true }
              );
              navigate("/assessment");
            }}
            style={styles.retakeBtn}
          >
            Retake Assessment
          </button>
        </div>

      </main>
    </>
  );
}

const styles = {
  main: { padding: "48px 24px", maxWidth: 800, margin: "0 auto" },
  centered: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" },
  loadingCard: { textAlign: "center", padding: 48, background: "white", borderRadius: 20, border: "1px solid #e2e8f0", maxWidth: 420 },
  loadingTitle: { fontSize: 20, fontWeight: 700, marginBottom: 12, color: "#0f172a" },
  loadingText: { color: "#64748b", fontSize: 14, lineHeight: 1.6 },
  spinner: { width: 40, height: 40, border: "4px solid #e2e8f0", borderTop: "4px solid #0d9488", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" },
  header: { textAlign: "center", marginBottom: 48 },
  headerTitle: { fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 12 },
  headerSubtitle: { fontSize: 16, color: "#64748b", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 16px" },
  personalityBadge: { display: "inline-block", background: "#e0fdf4", color: "#0d9488", padding: "6px 16px", borderRadius: 999, fontSize: 14, fontWeight: 600 },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 20 },
  careerGrid: { display: "flex", flexDirection: "column", gap: 16 },
  careerCard: { padding: 24, borderRadius: 16, background: "white", border: "2px solid #e2e8f0", position: "relative" },
  bestMatchBadge: { position: "absolute", top: 16, right: 16, background: "#0d9488", color: "white", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 999 },
  careerTitle: { fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 12 },
  matchBarWrapper: { width: "100%", height: 6, background: "#e5e7eb", borderRadius: 999, marginBottom: 6 },
  matchBarFill: { height: "100%", background: "linear-gradient(90deg, #0d9488, #3b82f6)", borderRadius: 999 },
  matchPercent: { fontSize: 13, fontWeight: 600, color: "#0d9488" },
  careerReason: { marginTop: 12, fontSize: 14, color: "#64748b", lineHeight: 1.6 },
  tagsRow: { display: "flex", flexWrap: "wrap", gap: 10 },
  strengthTag: { background: "#eff6ff", color: "#1d4ed8", padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 500 },
  skillTag: { background: "#fdf4ff", color: "#7c3aed", padding: "8px 16px", borderRadius: 999, fontSize: 14, fontWeight: 500 },
  roadmap: { display: "flex", flexDirection: "column", gap: 16 },
  roadmapStep: { display: "flex", gap: 16, alignItems: "flex-start" },
  stepNumber: { width: 36, height: 36, borderRadius: "50%", background: "#0d9488", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 },
  stepContent: { flex: 1, background: "white", padding: "16px 20px", borderRadius: 12, border: "1px solid #e2e8f0" },
  stepTitle: { fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 },
  stepDesc: { fontSize: 14, color: "#64748b", lineHeight: 1.6 },
  primaryBtn: { padding: "12px 24px", borderRadius: 10, border: "none", background: "#0d9488", color: "white", cursor: "pointer", fontSize: 15 },
  retakeBtn: { padding: "14px 32px", borderRadius: 12, border: "2px solid #0d9488", background: "transparent", color: "#0d9488", cursor: "pointer", fontSize: 15, fontWeight: 600 },
};