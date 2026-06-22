import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { QuestionsSchema } from "../schemas";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

const LETTERS = ["A", "B", "C", "D"];

// errorKind: null | "network" | "parse" | "rate_limit"
//   "parse"      → AI returned wrong shape; offer Regenerate (clears cache, retries)
//   "network"    → fetch / upstream failure; offer Try Again
//   "rate_limit" → 429; show server message, disable button

export default function Assessment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [errorKind, setErrorKind] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // "Other" / open-ended question state
  // otherActive — whether the "Other" option is visually selected on the current MCQ
  // otherDraft  — the text currently in the Other input or open textarea
  const [otherActive, setOtherActive] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");

  // ── When the displayed question changes, restore "Other"/open draft state ──
  // We intentionally exclude `answers` from the dep array: we only want to sync
  // when the user navigates between questions, not on every keystroke.
  useEffect(() => {
    if (questions.length === 0) return;
    const q = questions[currentIndex];
    if (!q) return;

    const saved = answers[q.id] ?? "";

    if (q.type === "open") {
      setOtherActive(false);
      setOtherDraft(saved); // restore previously typed open answer
    } else {
      // MCQ: saved answer is either one of the 4 options, empty, or a custom "Other" text
      const isFixed = q.options.includes(saved);
      if (!isFixed && saved !== "") {
        setOtherActive(true);
        setOtherDraft(saved); // restore previously typed "Other" answer
      } else {
        setOtherActive(false);
        setOtherDraft("");
      }
    }
  }, [currentIndex, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate questions ────────────────────────────────────────────────────
  const generateQuestions = useCallback(async () => {
    setLoadingQuestions(true);
    setErrorKind(null);
    setErrorMessage("");

    try {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : {};

      const prompt = `You are a career assessment expert. Generate a personalised career quiz for this user.

User Profile:
- Name: ${profile.name || "Unknown"}
- Age: ${profile.age || "Unknown"}
- Role: ${profile.role || "Unknown"}

Step 1 — Decide the question count.
Based on how much context the profile gives you, choose between 20 and 30 multiple-choice questions. A student with a thin profile might need 25 broad questions to establish a baseline; someone whose role already reveals a direction might need 20 focused ones. Use your judgement — more is not always better.

Step 2 — Write the multiple-choice questions (type "mcq").
- Cover these dimensions: interests, personality, work style, strengths, weaknesses, values, skills, motivation, preferred environment, learning style.
- Each question must have exactly 4 options. Do NOT add an "Other" option — the interface adds it automatically.
- Options must be meaningfully distinct; avoid near-synonyms.
- Questions should be specific and thought-provoking, not generic.

Step 3 — Add exactly one open-ended question as the FINAL item (type "open").
- Ask the user to freely describe their goals, dreams, or what kind of impact they want to make.
- options must be an empty array [].

Return ONLY a valid JSON array — no markdown, no explanation, no wrapper object.

Format (all MCQ then one open at the end):
[
  {
    "id": "Q1",
    "question": "Which of these activities do you find most energising?",
    "type": "mcq",
    "options": [
      "Solving complex technical problems",
      "Leading and motivating a team",
      "Creating something visual or artistic",
      "Researching and analysing data"
    ]
  },
  {
    "id": "Q{N}",
    "question": "In your own words, describe what excites you most about your future or what kind of impact you would like to make.",
    "type": "open",
    "options": []
  }
]`;

      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 429) {
        const body = await response.json().catch(() => ({}));
        setErrorKind("rate_limit");
        setErrorMessage(body.error ?? "Too many requests. Please wait before trying again.");
        setLoadingQuestions(false);
        return;
      }

      if (!response.ok) {
        setErrorKind("network");
        setErrorMessage("The server returned an error. Please try again.");
        setLoadingQuestions(false);
        return;
      }

      const data = await response.json();
      const raw = data?.content?.[0]?.text ?? "";
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("Assessment: JSON.parse failed.\nRaw output:", raw);
        setErrorKind("parse");
        setErrorMessage("The AI returned a response we couldn't read.");
        setLoadingQuestions(false);
        return;
      }

      const validation = QuestionsSchema.safeParse(parsed);
      if (!validation.success) {
        console.error("Assessment: schema validation failed.", validation.error.flatten());
        setErrorKind("parse");
        setErrorMessage("The AI returned a response we couldn't read.");
        setLoadingQuestions(false);
        return;
      }

      const validated = validation.data;

      // Only write to Firestore once we know the shape is valid
      await setDoc(
        doc(db, "assessments", currentUser.uid),
        { questions: validated, answers: {}, lastQuestionIndex: 0, updatedAt: new Date() },
        { merge: true }
      );

      setQuestions(validated);
      setLoadingQuestions(false);
    } catch (err) {
      console.error("Assessment: unexpected error:", err);
      setErrorKind("network");
      setErrorMessage("Something went wrong. Please try again.");
      setLoadingQuestions(false);
    }
  }, [currentUser.uid]);

  // ── On mount: load from Firestore cache or generate fresh ─────────────────
  useEffect(() => {
    const loadOrGenerate = async () => {
      try {
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
      } catch (err) {
        console.error("Assessment: failed to load:", err);
        setErrorKind("network");
        setErrorMessage("Couldn't load your assessment. Please try again.");
        setLoadingQuestions(false);
      }
    };

    loadOrGenerate();
  }, [currentUser.uid, generateQuestions]);

  // ── Regenerate: wipe bad/missing Firestore data then retry ───────────────
  const handleRegenerate = async () => {
    await setDoc(
      doc(db, "assessments", currentUser.uid),
      { questions: [], answers: {}, lastQuestionIndex: 0 },
      { merge: true }
    );
    generateQuestions();
  };

  // ── Firestore progress save ───────────────────────────────────────────────
  const saveProgress = async (updatedAnswers, index) => {
    await setDoc(
      doc(db, "assessments", currentUser.uid),
      { answers: updatedAnswers, lastQuestionIndex: index, updatedAt: new Date() },
      { merge: true }
    );
  };

  // ── MCQ: fixed option clicked → immediate advance ─────────────────────────
  const handleFixedOption = async (opt) => {
    const question = questions[currentIndex];
    const updatedAnswers = { ...answers, [question.id]: opt };
    const nextIndex = currentIndex + 1;

    setAnswers(updatedAnswers);
    setOtherActive(false);
    setOtherDraft("");
    await saveProgress(updatedAnswers, nextIndex);

    if (nextIndex >= questions.length) {
      navigate("/results");
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  // ── MCQ: "Other" selected → reveal text input, no advance ────────────────
  const handleSelectOther = () => {
    const question = questions[currentIndex];
    // If a fixed option was previously selected, clear it so "Other" is the selection
    if (question.options.includes(answers[question.id])) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[question.id];
        return next;
      });
    }
    setOtherActive(true);
    // Keep any existing draft text (e.g. if user toggled back to Other)
  };

  // ── "Next" click: for Other (MCQ) and open questions ─────────────────────
  const handleAdvance = async () => {
    const question = questions[currentIndex];
    const value = otherDraft.trim();
    if (!value) return; // require non-empty before advancing

    const updatedAnswers = { ...answers, [question.id]: value };
    const nextIndex = currentIndex + 1;

    setAnswers(updatedAnswers);
    setOtherActive(false);
    setOtherDraft("");
    await saveProgress(updatedAnswers, nextIndex);

    if (nextIndex >= questions.length) {
      navigate("/results");
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  // ── Previous: preserve any in-progress draft before going back ────────────
  const handlePrevious = async () => {
    if (currentIndex === 0) return;
    const question = questions[currentIndex];
    let currentAnswers = answers;

    // If the user typed something but hadn't clicked Next, save it as a draft
    // so they don't lose their work when they come back to this question.
    if ((otherActive || question.type === "open") && otherDraft.trim()) {
      currentAnswers = { ...answers, [question.id]: otherDraft.trim() };
      setAnswers(currentAnswers);
    }

    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    await saveProgress(currentAnswers, prevIndex);
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingQuestions) {
    return (
      <PageShell>
        <main style={centered}>
          <StatusCard>
            <Spinner />
            <h2 style={statusTitle}>Personalising your assessment…</h2>
            <p style={statusBody}>
              The AI is crafting questions specifically for your profile.
              This takes about 10–20 seconds.
            </p>
          </StatusCard>
        </main>
      </PageShell>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (errorKind) {
    const isParseError = errorKind === "parse";
    const isRateLimit = errorKind === "rate_limit";
    return (
      <PageShell>
        <main style={centered}>
          <StatusCard>
            <div
              aria-hidden="true"
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: `${C.marigold}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                margin: "0 auto 20px",
              }}
            >
              {isParseError ? "🗺" : "⚠"}
            </div>

            <h2 style={{ ...statusTitle, marginBottom: 8 }}>
              {isParseError ? "Couldn't generate questions" : "Something went wrong"}
            </h2>

            <p style={{ ...statusBody, marginBottom: 24 }}>{errorMessage}</p>

            {isParseError ? (
              <button onClick={handleRegenerate} style={primaryBtn}>
                Regenerate Questions
              </button>
            ) : (
              <button
                onClick={isRateLimit ? undefined : generateQuestions}
                disabled={isRateLimit}
                style={{
                  ...primaryBtn,
                  ...(isRateLimit ? { opacity: 0.5, cursor: "not-allowed" } : {}),
                }}
              >
                Try Again
              </button>
            )}
          </StatusCard>
        </main>
      </PageShell>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const question = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const isLastQuestion = currentIndex === questions.length - 1;
  const isOpenQuestion = question.type === "open";
  const showTextArea = isOpenQuestion || otherActive;
  const savedAnswer = answers[question.id] ?? "";

  return (
    <PageShell>
      <main style={{ padding: "48px 24px", maxWidth: 680, margin: "0 auto" }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              fontWeight: 600,
              color: C.muted,
              marginBottom: 8,
            }}
          >
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ color: C.marigold }}>{progressPercent}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: 6,
              background: C.mist,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPercent}%`,
                background: C.marigold,
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Question card */}
        <div
          style={{
            padding: "32px 28px",
            borderRadius: 18,
            background: "#fff",
            border: `1px solid ${C.mist}`,
          }}
        >
          {/* Question type label */}
          {isOpenQuestion && (
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: C.sage,
                background: `${C.sage}12`,
                padding: "3px 8px",
                borderRadius: 4,
                marginBottom: 14,
              }}
            >
              Open question
            </span>
          )}

          <h2
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(18px, 3vw, 22px)",
              fontWeight: 800,
              color: C.ink,
              lineHeight: 1.45,
              margin: "0 0 24px",
            }}
          >
            {question.question}
          </h2>

          {/* ── MCQ options ── */}
          {!isOpenQuestion && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>

              {/* Fixed options A–D */}
              {question.options.map((opt, i) => {
                const selected = !otherActive && savedAnswer === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleFixedOption(opt)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "13px 18px",
                      textAlign: "left",
                      borderRadius: 12,
                      border: `1.5px solid ${selected ? C.marigold : C.mist}`,
                      background: selected ? `${C.marigold}12` : C.paper,
                      cursor: "pointer",
                      fontSize: 15,
                      color: C.ink,
                      fontFamily: "'Inter', sans-serif",
                      transition: "border-color .15s, background .15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!selected) e.currentTarget.style.borderColor = C.muted;
                    }}
                    onMouseLeave={(e) => {
                      if (!selected) e.currentTarget.style.borderColor = C.mist;
                    }}
                  >
                    <OptionBadge label={LETTERS[i]} active={selected} />
                    {opt}
                  </button>
                );
              })}

              {/* "Other" option (E) */}
              <button
                onClick={handleSelectOther}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "13px 18px",
                  textAlign: "left",
                  borderRadius: 12,
                  border: `1.5px solid ${otherActive ? C.marigold : C.mist}`,
                  background: otherActive ? `${C.marigold}12` : C.paper,
                  cursor: "pointer",
                  fontSize: 15,
                  color: otherActive ? C.ink : C.muted,
                  fontFamily: "'Inter', sans-serif",
                  transition: "border-color .15s, background .15s, color .15s",
                }}
                onMouseEnter={(e) => {
                  if (!otherActive) e.currentTarget.style.borderColor = C.muted;
                }}
                onMouseLeave={(e) => {
                  if (!otherActive) e.currentTarget.style.borderColor = C.mist;
                }}
              >
                <OptionBadge label="E" active={otherActive} />
                Other — I'll describe it myself
              </button>
            </div>
          )}

          {/* ── Text input: shown for "Other" (MCQ) and open questions ── */}
          {showTextArea && (
            <div style={{ marginTop: isOpenQuestion ? 0 : 16 }}>
              <textarea
                autoFocus
                value={otherDraft}
                onChange={(e) => setOtherDraft(e.target.value)}
                placeholder={
                  isOpenQuestion
                    ? "Share your thoughts here…"
                    : "Describe your answer…"
                }
                rows={isOpenQuestion ? 5 : 3}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1.5px solid ${C.mist}`,
                  background: C.paper,
                  color: C.ink,
                  fontSize: 15,
                  fontFamily: "'Inter', sans-serif",
                  resize: "vertical",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color .15s",
                  lineHeight: 1.6,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.marigold)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.mist)}
                onKeyDown={(e) => {
                  // Ctrl/Cmd+Enter submits
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleAdvance();
                }}
              />
              <button
                onClick={handleAdvance}
                disabled={!otherDraft.trim()}
                style={{
                  marginTop: 10,
                  padding: "11px 22px",
                  borderRadius: 12,
                  border: "none",
                  background: otherDraft.trim() ? C.marigold : C.mist,
                  color: otherDraft.trim() ? "#fff" : C.muted,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: otherDraft.trim() ? "pointer" : "not-allowed",
                  transition: "background .15s, color .15s",
                }}
              >
                {isLastQuestion ? "See My Results →" : "Next →"}
              </button>
              {isOpenQuestion && (
                <p style={{ marginTop: 8, fontSize: 12, color: C.muted }}>
                  Ctrl + Enter to submit
                </p>
              )}
            </div>
          )}

          {/* Previous button */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              marginTop: 24,
              padding: "9px 18px",
              borderRadius: 10,
              border: `1.5px solid ${C.mist}`,
              background: "transparent",
              color: currentIndex === 0 ? C.mist : C.muted,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              fontSize: 14,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
            }}
          >
            ← Previous
          </button>
        </div>
      </main>
    </PageShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OptionBadge({ label, active }) {
  return (
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        background: active ? C.marigold : C.mist,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 12,
        color: active ? "#fff" : C.muted,
        flexShrink: 0,
        transition: "background .15s, color .15s",
      }}
    >
      {label}
    </span>
  );
}

function PageShell({ children }) {
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
      {children}
    </div>
  );
}

function StatusCard({ children }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: 48,
        background: "#fff",
        borderRadius: 20,
        border: `1px solid ${C.mist}`,
        maxWidth: 420,
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        border: `4px solid ${C.mist}`,
        borderTop: `4px solid ${C.marigold}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto 24px",
      }}
    />
  );
}

const centered = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "80vh",
  padding: "24px",
};

const statusTitle = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 12,
  color: C.ink,
};

const statusBody = { color: C.muted, fontSize: 14, lineHeight: 1.6 };

const primaryBtn = {
  padding: "12px 24px",
  borderRadius: 12,
  border: "none",
  background: C.marigold,
  color: "#fff",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
};
