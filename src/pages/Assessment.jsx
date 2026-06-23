import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QuestionsSchema } from "../schemas";
import { C, font } from "../theme";

const LETTERS = ["A", "B", "C", "D"];

export default function Assessment() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [errorKind, setErrorKind] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [itemTitle, setItemTitle] = useState("");
  const [otherActive, setOtherActive] = useState(false);
  const [otherDraft, setOtherDraft] = useState("");

  // Redirect to profile if no id param
  useEffect(() => {
    if (!assessmentId) navigate("/profile", { replace: true });
  }, [assessmentId, navigate]);

  const itemRef = assessmentId
    ? doc(db, "assessments", currentUser.uid, "items", assessmentId)
    : null;

  // Restore Other/open draft when question changes
  useEffect(() => {
    if (questions.length === 0) return;
    const q = questions[currentIndex];
    if (!q) return;
    const saved = answers[q.id] ?? "";
    if (q.type === "open") {
      setOtherActive(false);
      setOtherDraft(saved);
    } else {
      const isFixed = q.options.includes(saved);
      if (!isFixed && saved !== "") {
        setOtherActive(true);
        setOtherDraft(saved);
      } else {
        setOtherActive(false);
        setOtherDraft("");
      }
    }
  }, [currentIndex, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Generate questions ────────────────────────────────────────────────────
  const generateQuestions = useCallback(async () => {
    if (!itemRef) return;
    setLoadingQuestions(true);
    setErrorKind(null);
    setErrorMessage("");

    try {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const profile = profileSnap.exists() ? profileSnap.data() : {};
      const itemSnap = await getDoc(itemRef);
      const itemData = itemSnap.exists() ? itemSnap.data() : {};
      const goal      = itemData.goal      || "career";
      const title     = itemData.title     || "";
      const objective = itemData.objective || "";

      const goalContext =
        goal === "skill"
          ? `This entire quiz is about one thing: helping the user learn "${title}".
Every question must directly probe some aspect of that skill. Cover:
  • Current skill level — what have they already tried, practised, or studied related to "${title}"?
  • Motivation — why do they want to learn it, what outcome are they chasing?
  • Learning style — how do they best absorb new skills (videos, practice, reading, projects, coaching)?
  • Time commitment — how much time per week can they realistically dedicate?
  • Strengths that transfer — which existing abilities will help them pick up "${title}" faster?
  • Gaps and blockers — what holds them back (confidence, tools, time, prior knowledge)?
  • Desired end goal — what does "mastery" look like to them for "${title}"?
Never drift to generic career topics. Every question must be anchored to "${title}".`
          : `This entire quiz is about one thing: helping the user explore and build a path toward "${title}".
Every question must directly probe some aspect of that career. Cover:
  • Career fit — do their interests, values, and personality align with "${title}"?
  • Current proximity — how close are they already (study, experience, exposure)?
  • Motivation — what draws them to "${title}" specifically, not just the field in general?
  • Working style — environment, collaboration, autonomy, pace preferences relevant to "${title}"?
  • Strengths — which of their skills and traits are assets for someone in "${title}"?
  • Gaps — what skills, knowledge, or experience are they missing for "${title}"?
  • Long-term vision — what does a successful career in "${title}" look like for them in 5–10 years?
Never drift to unrelated careers. Every question must be anchored to "${title}".`;

      const prompt = `You are an expert career and skills assessor. Your task is to generate a deeply personalised quiz for one specific user. The quiz has a single focus — everything revolves around: "${title}".

User Profile:
- Name: ${profile.name || "Unknown"}
- Age: ${profile.age || "Unknown"}
- Current role / year: ${profile.role || "Unknown"}
- Assessment goal: ${goal === "skill" ? `Learn "${title}"` : `Build a career path toward "${title}"`}
- Stated goal: ${objective || "Not specified"}

Tailoring rules you MUST follow:
1. Anchor every single question to "${title}" — a reader should be able to tell the quiz is about that specific ${goal === "skill" ? "skill" : "career"} without reading the title.
2. Calibrate vocabulary and framing to the user's age (${profile.age || "unknown"}) and role (${profile.role || "unknown"}). For a school student use accessible, concrete language; for a professional use field-appropriate terminology.
3. Do not write questions that could belong to a generic career quiz. Every question must feel like it was written specifically for someone interested in "${title}".

${goalContext}
${objective ? `The user's stated goal is: "${objective}". Make sure at least one or two questions probe how close their current habits or knowledge are to this specific goal.` : ""}

DIAGNOSTIC BLOCK — these must be the FIRST 4–6 questions in the array. They measure the user's CURRENT knowledge of "${title}" — not preferences. Include exactly:
1. A prior-exposure question (e.g. "Have you ever formally learned or practised ${title} before?") with options spanning: Never → Self-taught a little → Took a course or class → Years of practice.
2. A self-rated proficiency question with options: Complete beginner → Basic understanding → Intermediate → Advanced.
3. Two to four genuine knowledge-check MCQs whose difficulty is calibrated to "${title}" (e.g. for singing: pitch/breathing/scales; for Python: variables/loops/functions; for finance: concepts like compound interest or P&L). Each must have one clearly correct answer and plausible distractors so the report can infer real skill level. Phrase them as normal quiz questions — do NOT label them "test" or mark the correct option in any way. Each still needs exactly 4 options.

Step 1 — Decide the remaining question count.
After the diagnostic block, add between 16 and 26 more MCQ questions (total including diagnostic must stay at or below 34, leaving room for the one open question). A user with a thin profile needs more general questions; a user whose role already reveals direction can have fewer.

Step 2 — Write the remaining multiple-choice questions (type "mcq").
- Each question must have exactly 4 options. Do NOT include an "Other" option — the UI adds it automatically.
- All 4 options must be meaningfully distinct — no near-synonyms or obvious filler.
- Questions must span the dimensions listed above for this goal type; do not over-index on any single dimension.

Step 3 — Add exactly one open-ended question as the FINAL item (type "open").
- Ask the user to describe, in their own words, what achieving their goal with "${title}" looks like and why it matters to them.
- options must be an empty array [].

Return ONLY a valid JSON array — no markdown, no explanation, no wrapper object.

Format:
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
    "question": "In your own words, describe what achieving your goal with \\"${title}\\" looks like and why it matters to you.",
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
      await setDoc(itemRef, {
        questions: validated,
        answers: {},
        lastQuestionIndex: 0,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setQuestions(validated);
      setLoadingQuestions(false);
    } catch (err) {
      console.error("Assessment: unexpected error:", err);
      setErrorKind("network");
      setErrorMessage("Something went wrong. Please try again.");
      setLoadingQuestions(false);
    }
  }, [currentUser.uid, itemRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── On mount: load from cache or generate ─────────────────────────────────
  useEffect(() => {
    if (!itemRef) return;
    const loadOrGenerate = async () => {
      try {
        const snap = await getDoc(itemRef);
        if (snap.exists() && snap.data().questions?.length > 0) {
          const data = snap.data();
          setItemTitle(data.title || "");
          setQuestions(data.questions);
          setAnswers(data.answers || {});
          setCurrentIndex(data.lastQuestionIndex || 0);
          setLoadingQuestions(false);
        } else {
          if (snap.exists()) setItemTitle(snap.data().title || "");
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
  }, [assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = async () => {
    if (!itemRef) return;
    await setDoc(itemRef, { questions: [], answers: {}, lastQuestionIndex: 0 }, { merge: true });
    generateQuestions();
  };

  const saveProgress = async (updatedAnswers, index) => {
    if (!itemRef) return;
    await setDoc(itemRef, {
      answers: updatedAnswers,
      lastQuestionIndex: index,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  };

  const handleFixedOption = async (opt) => {
    const question = questions[currentIndex];
    const updatedAnswers = { ...answers, [question.id]: opt };
    const nextIndex = currentIndex + 1;
    setAnswers(updatedAnswers);
    setOtherActive(false);
    setOtherDraft("");
    await saveProgress(updatedAnswers, nextIndex);
    if (nextIndex >= questions.length) {
      navigate(`/results?id=${assessmentId}`);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleSelectOther = () => {
    const question = questions[currentIndex];
    if (question.options.includes(answers[question.id])) {
      setAnswers((prev) => { const n = { ...prev }; delete n[question.id]; return n; });
    }
    setOtherActive(true);
  };

  const handleAdvance = async () => {
    const question = questions[currentIndex];
    const value = otherDraft.trim();
    if (!value) return;
    const updatedAnswers = { ...answers, [question.id]: value };
    const nextIndex = currentIndex + 1;
    setAnswers(updatedAnswers);
    setOtherActive(false);
    setOtherDraft("");
    await saveProgress(updatedAnswers, nextIndex);
    if (nextIndex >= questions.length) {
      navigate(`/results?id=${assessmentId}`);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handlePrevious = async () => {
    if (currentIndex === 0) return;
    const question = questions[currentIndex];
    let currentAnswers = answers;
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
              The AI is crafting questions specifically for your profile. This takes about 10–20 seconds.
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
                style={{ ...primaryBtn, ...(isRateLimit ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
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
        {/* Title chip */}
        {itemTitle && (
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 12, fontWeight: 600 }}>
            Assessment: <span style={{ color: C.ink }}>{itemTitle}</span>
          </p>
        )}

        {/* Progress bar */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: C.muted, marginBottom: 8 }}>
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ color: C.marigold }}>{progressPercent}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: C.mist, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPercent}%`, background: C.marigold, borderRadius: 999, transition: "width 0.4s ease" }} />
          </div>
        </div>

        {/* Question card */}
        <div style={{ padding: "32px 28px", borderRadius: 18, background: "#fff", border: `1px solid ${C.mist}` }}>
          {isOpenQuestion && (
            <span style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: C.sage, background: `${C.sage}12`, padding: "3px 8px", borderRadius: 4, marginBottom: 14 }}>
              Open question
            </span>
          )}

          <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(18px, 3vw, 22px)", fontWeight: 800, color: C.ink, lineHeight: 1.45, margin: "0 0 24px" }}>
            {question.question}
          </h2>

          {/* MCQ options */}
          {!isOpenQuestion && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {question.options.map((opt, i) => {
                const selected = !otherActive && savedAnswer === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleFixedOption(opt)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      width: "100%", padding: "13px 18px", textAlign: "left",
                      borderRadius: 12,
                      border: `1.5px solid ${selected ? C.marigold : C.mist}`,
                      background: selected ? `${C.marigold}12` : C.paper,
                      cursor: "pointer", fontSize: 15, color: C.ink,
                      fontFamily: "'Inter', sans-serif",
                      transition: "border-color .15s, background .15s",
                    }}
                    onMouseEnter={(e) => { if (!selected) e.currentTarget.style.borderColor = C.muted; }}
                    onMouseLeave={(e) => { if (!selected) e.currentTarget.style.borderColor = C.mist; }}
                  >
                    <OptionBadge label={LETTERS[i]} active={selected} />
                    {opt}
                  </button>
                );
              })}

              {/* Other option */}
              <button
                onClick={handleSelectOther}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "13px 18px", textAlign: "left",
                  borderRadius: 12,
                  border: `1.5px solid ${otherActive ? C.marigold : C.mist}`,
                  background: otherActive ? `${C.marigold}12` : C.paper,
                  cursor: "pointer", fontSize: 15,
                  color: otherActive ? C.ink : C.muted,
                  fontFamily: "'Inter', sans-serif",
                  transition: "border-color .15s, background .15s, color .15s",
                }}
                onMouseEnter={(e) => { if (!otherActive) e.currentTarget.style.borderColor = C.muted; }}
                onMouseLeave={(e) => { if (!otherActive) e.currentTarget.style.borderColor = C.mist; }}
              >
                <OptionBadge label="E" active={otherActive} />
                Other — I'll describe it myself
              </button>
            </div>
          )}

          {/* Text area for Other / open */}
          {showTextArea && (
            <div style={{ marginTop: isOpenQuestion ? 0 : 16 }}>
              <textarea
                autoFocus
                value={otherDraft}
                onChange={(e) => setOtherDraft(e.target.value)}
                placeholder={isOpenQuestion ? "Share your thoughts here…" : "Describe your answer…"}
                rows={isOpenQuestion ? 5 : 3}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 10,
                  border: `1.5px solid ${C.mist}`, background: C.paper, color: C.ink,
                  fontSize: 15, fontFamily: "'Inter', sans-serif",
                  resize: "vertical", outline: "none", boxSizing: "border-box",
                  transition: "border-color .15s", lineHeight: 1.6,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.marigold)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.mist)}
                onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleAdvance(); }}
              />
              <button
                onClick={handleAdvance}
                disabled={!otherDraft.trim()}
                style={{
                  marginTop: 10, padding: "11px 22px", borderRadius: 12, border: "none",
                  background: otherDraft.trim() ? C.marigold : C.mist,
                  color: otherDraft.trim() ? "#fff" : C.muted,
                  fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                  cursor: otherDraft.trim() ? "pointer" : "not-allowed",
                  transition: "background .15s, color .15s",
                }}
              >
                {isLastQuestion ? "See My Results →" : "Next →"}
              </button>
              {isOpenQuestion && (
                <p style={{ marginTop: 8, fontSize: 12, color: C.muted }}>Ctrl + Enter to submit</p>
              )}
            </div>
          )}

          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            style={{
              marginTop: 24, padding: "9px 18px", borderRadius: 10,
              border: `1.5px solid ${C.mist}`, background: "transparent",
              color: currentIndex === 0 ? C.mist : C.muted,
              cursor: currentIndex === 0 ? "not-allowed" : "pointer",
              fontSize: 14, fontFamily: "'Inter', sans-serif", fontWeight: 600,
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
        width: 28, height: 28, borderRadius: "50%",
        background: active ? C.marigold : C.mist,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 12,
        color: active ? "#fff" : C.muted,
        flexShrink: 0, transition: "background .15s, color .15s",
      }}
    >
      {label}
    </span>
  );
}

function PageShell({ children }) {
  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink }}>
        <Navbar />
        {children}
      </div>
    </PageTransition>
  );
}

function StatusCard({ children }) {
  return (
    <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 20, border: `1px solid ${C.mist}`, maxWidth: 420, width: "100%" }}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ width: 40, height: 40, border: `4px solid ${C.mist}`, borderTop: `4px solid ${C.marigold}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />
  );
}

const centered = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "24px" };
const statusTitle = { fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.ink };
const statusBody = { color: C.muted, fontSize: 14, lineHeight: 1.6 };
const primaryBtn = { padding: "12px 24px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Inter', sans-serif" };
