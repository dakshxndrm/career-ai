import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ResultSchema } from "../schemas";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

export default function Results() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorKind, setErrorKind] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedCareers, setSavedCareers] = useState([]);
  const [itemTitle, setItemTitle] = useState("");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const RESULT_MSGS = ["Reading your answers…", "Matching career paths…", "Writing your plan…"];

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % RESULT_MSGS.length), 3000);
    return () => clearInterval(id);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect if no id
  useEffect(() => {
    if (!assessmentId) navigate("/profile", { replace: true });
  }, [assessmentId, navigate]);

  // Legacy assessments live at assessments/{uid} (old single-doc format)
  const itemRef = assessmentId
    ? assessmentId === "legacy"
      ? doc(db, "assessments", currentUser.uid)
      : doc(db, "assessments", currentUser.uid, "items", assessmentId)
    : null;

  // Load savedCareers
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
      if (snap.exists()) setSavedCareers(snap.data().savedCareers || []);
    });
  }, [currentUser]);

  const toggleSave = async (title) => {
    const isSaved = savedCareers.includes(title);
    setSavedCareers(isSaved ? savedCareers.filter((t) => t !== title) : [...savedCareers, title]);
    await updateDoc(doc(db, "users", currentUser.uid), {
      savedCareers: isSaved ? arrayRemove(title) : arrayUnion(title),
    });
  };

  // ── Generate result ────────────────────────────────────────────────────────
  const generateResult = useCallback(async () => {
    if (!itemRef) return;
    setLoading(true);
    setErrorKind(null);
    setErrorMessage("");

    try {
      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const itemSnap = await getDoc(itemRef);

      const profile = profileSnap.exists() ? profileSnap.data() : {};
      const itemData = itemSnap.exists() ? itemSnap.data() : {};

      setItemTitle(itemData.title || "");

      if (itemData.result) {
        setResult(itemData.result);
        setLoading(false);
        return;
      }

      const questions  = itemData.questions  || [];
      const answers    = itemData.answers    || {};
      const objective  = itemData.objective  || "";

      const qaSummary = questions
        .map((q) => `Q: ${q.question}\nA: ${answers[q.id] || "Not answered"}`)
        .join("\n\n");

      const prompt = `You are an expert career counselor. Based on this user's profile and quiz answers, give a personalized career report.

User Profile:
- Name: ${profile.name || "Unknown"}
- Age: ${profile.age || "Unknown"}
- Role: ${profile.role || "Unknown"}
- Assessment title: ${itemData.title || "Unknown"}
- Goal type: ${itemData.goal === "skill" ? "Learning a specific skill" : "Discovering career paths"}${objective ? `\n- Stated goal: ${objective}` : ""}

Quiz Answers (the FIRST 4–6 are diagnostic questions measuring current knowledge):
${qaSummary}

DIAGNOSIS — Based ESPECIALLY on the diagnostic answers (prior exposure, self-rated proficiency, and the knowledge-check questions), judge the user's REAL current level with "${itemData.title || "this topic"}". Set currentLevel to beginner/intermediate/advanced, write levelEvidence citing 1–2 of their specific answers, list knownAreas they already have, and gapAreas (key skills they still need for "${itemData.title || "this topic"}"). Do NOT over-rate beginners.${objective ? `

GOAL PLAN — The user's goal is: "${objective}". After assessing their currentLevel and gapAreas, produce goalPlan: restate the goal verbatim, give an honest feasibility read from where they are now, an estimatedTime range (e.g. "4–6 months at ~6 hrs/week"), and 3–6 ordered milestones that bridge their current level (and gapAreas) to this goal. Be encouraging but realistic — do not promise unrealistic timelines.` : ""}

Return ONLY a valid JSON object, no markdown, no extra text:
{
  "topCareers": [
    { "title": "Career Name", "match": 95, "reason": "2-3 sentence explanation" },
    { "title": "Career Name", "match": 85, "reason": "2-3 sentence explanation" },
    { "title": "Career Name", "match": 75, "reason": "2-3 sentence explanation" }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "skillsToLearn": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "roadmap": [
    { "step": 1, "title": "Step title", "description": "What to do" },
    { "step": 2, "title": "Step title", "description": "What to do" },
    { "step": 3, "title": "Step title", "description": "What to do" },
    { "step": 4, "title": "Step title", "description": "What to do" }
  ],
  "personalityType": "2-3 word personality label",
  "summary": "2-3 sentence overall summary",
  "currentLevel": "beginner",
  "levelEvidence": "1-2 sentences citing their diagnostic answers",
  "knownAreas": ["area they already know"],
  "gapAreas": ["key gap 1", "key gap 2", "key gap 3"]${objective ? `,
  "goalPlan": {
    "goal": "restated user goal",
    "feasibility": "honest 1-2 sentence read of how reachable this is from current level",
    "estimatedTime": "e.g. 4–6 months at ~6 hrs/week",
    "milestones": [
      { "title": "Milestone title", "detail": "What to do or achieve at this stage" }
    ]
  }` : ""}
}`;

      const idToken = await auth.currentUser.getIdToken();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ prompt }),
      });

      if (response.status === 429) {
        const body = await response.json().catch(() => ({}));
        setErrorKind("rate_limit");
        setErrorMessage(body.error ?? "Too many requests. Please wait before trying again.");
        setLoading(false);
        return;
      }
      if (!response.ok) {
        setErrorKind("network");
        setErrorMessage("The server returned an error. Please try again.");
        setLoading(false);
        return;
      }

      const data = await response.json();
      const raw = data?.content?.[0]?.text ?? "";
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        console.error("Results: JSON.parse failed.\nRaw output:", raw);
        setErrorKind("parse");
        setErrorMessage("The AI returned a response we couldn't read.");
        setLoading(false);
        return;
      }

      const validation = ResultSchema.safeParse(parsed);
      if (!validation.success) {
        console.error("Results: schema validation failed.", validation.error.flatten());
        setErrorKind("parse");
        setErrorMessage("The AI returned a response we couldn't read.");
        setLoading(false);
        return;
      }

      const validated = validation.data;
      if (assessmentId !== "legacy") {
        await setDoc(itemRef, { result: validated, updatedAt: serverTimestamp() }, { merge: true });
      }
      setResult(validated);
      setLoading(false);
    } catch (err) {
      console.error("Results: unexpected error:", err);
      setErrorKind("network");
      setErrorMessage("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [currentUser.uid, assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (assessmentId) generateResult();
  }, [assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = async () => {
    if (!itemRef) return;
    await setDoc(itemRef, { result: null }, { merge: true });
    generateResult();
  };

  const handleRetake = () => {
    navigate("/quiz-instructions");
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageShell>
        <main style={centered}>
          <StatusCard>
            <Spinner />
            <h2 style={statusTitle}>Generating your report…</h2>
            <p style={statusBody}>{RESULT_MSGS[loadingMsgIdx]}</p>
            <p style={{ ...statusBody, fontSize: 13, color: C.muted, marginTop: 8 }}>
              This usually takes 15–30 seconds.
            </p>
          </StatusCard>
        </main>
      </PageShell>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (errorKind) {
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
                background: isRateLimit ? `${C.sage}18` : `${C.marigold}18`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                margin: "0 auto 20px",
              }}
            >
              {isRateLimit ? "⏱" : "⚠"}
            </div>
            <h2 style={{ ...statusTitle, marginBottom: 8 }}>
              {isRateLimit ? "Limit reached" : "Something went wrong"}
            </h2>
            <p style={{ ...statusBody, marginBottom: 24 }}>{errorMessage}</p>
            {!isRateLimit && (
              <button onClick={generateResult} style={primaryBtn}>
                Try again
              </button>
            )}
          </StatusCard>
        </main>
      </PageShell>
    );
  }

  // ── Report ────────────────────────────────────────────────────────────────
  return (
    <PageShell>
      <main style={{ padding: "56px 24px 80px", maxWidth: 760, margin: "0 auto", fontFamily: "'Inter', sans-serif", color: C.ink }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sage, marginBottom: 12 }}>
            Career Atlas — Your Report
          </p>
          {itemTitle && (
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>
              Assessment: <strong style={{ color: C.ink }}>{itemTitle}</strong>
            </p>
          )}
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 900, color: C.ink, margin: "0 0 14px", lineHeight: 1.1 }}>
            Your Career Map
          </h1>
          <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.7, maxWidth: 560, margin: "0 auto 18px" }}>
            {result.summary}
          </p>
          <span style={{ display: "inline-block", background: `${C.sage}18`, color: C.sage, padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>
            {result.personalityType}
          </span>
        </div>

        {/* ── Where you are now ── */}
        {result?.currentLevel && (
          <Section label="Where you are now">
            <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <LevelBadge level={result.currentLevel} />
                {result.levelEvidence && (
                  <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6, flex: 1, minWidth: 200 }}>{result.levelEvidence}</p>
                )}
              </div>
              {result.knownAreas?.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: C.sage, margin: "0 0 8px" }}>You already know</p>
                  <TagRow>{result.knownAreas.map((s, i) => <Tag key={i} bg={`${C.sage}14`} color={C.sage}>{s}</Tag>)}</TagRow>
                </div>
              )}
              {result.gapAreas?.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: C.marigold, margin: "0 0 8px" }}>Key gaps to close</p>
                  <TagRow>{result.gapAreas.map((s, i) => <Tag key={i} bg={`${C.marigold}14`} color={C.marigold}>{s}</Tag>)}</TagRow>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ── Your path to the goal ── */}
        {result?.goalPlan && (
          <Section label="Your path to the goal">
            <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 16, padding: "22px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: C.ink, margin: 0, lineHeight: 1.55 }}>
                🎯 {result.goalPlan.goal}
              </p>
              <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.65 }}>
                {result.goalPlan.feasibility}
              </p>
              {result.goalPlan.estimatedTime && (
                <span style={{ alignSelf: "flex-start", background: `${C.sage}14`, color: C.sage, padding: "6px 16px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                  ⏱ {result.goalPlan.estimatedTime}
                </span>
              )}
              {result.goalPlan.milestones?.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
                  {result.goalPlan.milestones.map((m, i) => (
                    <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.ink, color: C.paper, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0, fontFamily: "'Fraunces', Georgia, serif" }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 12, padding: "12px 16px" }}>
                        <h4 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 15, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{m.title}</h4>
                        <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{m.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Top careers */}
        <Section label="Top Career Matches">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {result.topCareers.map((career, i) => (
              <div key={i} style={{ padding: "22px 24px", borderRadius: 16, background: "#fff", border: `2px solid ${i === 0 ? C.marigold : C.mist}`, position: "relative" }}>
                <div style={{ position: "absolute", top: 16, right: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  {i === 0 && (
                    <span style={{ background: C.marigold, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999, letterSpacing: "0.05em" }}>
                      Best match
                    </span>
                  )}
                  <button
                    onClick={() => toggleSave(career.title)}
                    aria-label={savedCareers.includes(career.title) ? "Unsave career" : "Save career"}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 2, color: savedCareers.includes(career.title) ? C.marigold : C.mist, transition: "color .15s" }}
                    onMouseOver={(e) => (e.currentTarget.style.color = C.marigold)}
                    onMouseOut={(e) => (e.currentTarget.style.color = savedCareers.includes(career.title) ? C.marigold : C.mist)}
                  >
                    ★
                  </button>
                </div>
                <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 18, fontWeight: 800, color: C.ink, margin: "0 0 10px" }}>
                  {career.title}
                </h3>
                <div style={{ width: "100%", height: 5, background: C.mist, borderRadius: 999, marginBottom: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${career.match}%`, background: i === 0 ? C.marigold : C.sage, borderRadius: 999 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.marigold : C.sage }}>{career.match}% match</span>
                <p style={{ marginTop: 10, fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{career.reason}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section label="Your Strengths">
          <TagRow>{result.strengths.map((s, i) => <Tag key={i} bg={`${C.marigold}14`} color={C.marigold}>{s}</Tag>)}</TagRow>
        </Section>

        <Section label="Skills to Develop">
          <TagRow>{result.skillsToLearn.map((s, i) => <Tag key={i} bg={`${C.sage}12`} color={C.sage}>{s}</Tag>)}</TagRow>
        </Section>

        <Section label="Your Roadmap">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {result.roadmap.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.ink, color: C.paper, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0, fontFamily: "'Fraunces', Georgia, serif" }}>
                  {step.step}
                </div>
                <div style={{ flex: 1, background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 12, padding: "14px 18px" }}>
                  <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{step.title}</h3>
                  <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.6 }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 48, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate(`/roadmap?id=${assessmentId}`)}
            style={{ padding: "13px 28px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Open Roadmap →
          </button>
          <button
            onClick={handleRetake}
            style={{ padding: "13px 28px", borderRadius: 12, border: `2px solid ${C.ink}`, background: "transparent", color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
            onMouseOver={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; }}
          >
            New Assessment
          </button>
        </div>
      </main>
    </PageShell>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: C.paper }}><Navbar />{children}</div>
    </PageTransition>
  );
}

function LevelBadge({ level }) {
  const cfg = {
    beginner:     { label: "Beginner",     bg: `${C.mist}`,            color: C.muted  },
    intermediate: { label: "Intermediate", bg: `${C.marigold}18`,      color: C.marigold },
    advanced:     { label: "Advanced",     bg: `${C.sage}18`,          color: C.sage   },
  };
  const { label, bg, color } = cfg[level] || cfg.beginner;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: bg, color, padding: "7px 16px", borderRadius: 999, fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", flexShrink: 0 }}>
      {level === "beginner" ? "🌱" : level === "intermediate" ? "📈" : "🏆"} {label}
    </span>
  );
}

function Section({ label, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 16 }}>{label}</h2>
      {children}
    </section>
  );
}

function TagRow({ children }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>;
}

function Tag({ children, bg, color }) {
  return <span style={{ background: bg, color, padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600 }}>{children}</span>;
}

function StatusCard({ children }) {
  return <div style={{ textAlign: "center", padding: 48, background: "#fff", borderRadius: 20, border: `1px solid ${C.mist}`, maxWidth: 420, width: "100%" }}>{children}</div>;
}

function Spinner() {
  return <div style={{ width: 40, height: 40, border: `4px solid ${C.mist}`, borderTop: `4px solid ${C.marigold}`, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 24px" }} />;
}

const centered = { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh", padding: "24px" };
const statusTitle = { fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 700, marginBottom: 12, color: C.ink };
const statusBody = { color: C.muted, fontSize: 14, lineHeight: 1.6 };
const primaryBtn = { padding: "12px 24px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "'Inter', sans-serif" };
