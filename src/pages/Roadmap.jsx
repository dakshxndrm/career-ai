import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { RoadmapSchema } from "../schemas";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

// Static fallback used when AI call fails
const STATIC_PHASES = [
  {
    phase: 1,
    title: "Foundations",
    blurb: "Build core skills and explore the field through structured learning.",
    weeks: "Weeks 1–4",
    skills: [
      { id: "s1-critical", label: "Critical Thinking" },
      { id: "s1-research", label: "Research Methods" },
      { id: "s1-writing", label: "Technical Writing" },
    ],
    courses: [
      { title: "Learning How to Learn", provider: "Coursera", url: "https://www.coursera.org/learn/learning-how-to-learn" },
      { title: "Introduction to Personal Finance", provider: "Khan Academy", url: "https://www.khanacademy.org/college-careers-more/personal-finance" },
    ],
  },
  {
    phase: 2,
    title: "Skill Building",
    blurb: "Develop practical skills with hands-on projects and mentorship.",
    weeks: "Weeks 5–12",
    skills: [
      { id: "s2-projects", label: "Project Management" },
      { id: "s2-collab", label: "Collaboration" },
      { id: "s2-comms", label: "Communication" },
    ],
    courses: [
      { title: "Project Management Basics", provider: "Google (Coursera)", url: "https://www.coursera.org/professional-certificates/google-project-management" },
      { title: "Effective Communication", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/" },
    ],
  },
  {
    phase: 3,
    title: "Real-World Experience",
    blurb: "Apply your skills in internships, volunteer roles, or personal projects.",
    weeks: "Weeks 13–20",
    skills: [
      { id: "s3-networking", label: "Professional Networking" },
      { id: "s3-portfolio", label: "Portfolio Building" },
      { id: "s3-adapt", label: "Adaptability" },
    ],
    courses: [
      { title: "How to Build a Portfolio", provider: "YouTube (FreeCodeCamp)", url: "https://www.youtube.com/c/freecodecamp" },
      { title: "LinkedIn Profile Optimization", provider: "LinkedIn Learning", url: "https://www.linkedin.com/learning/" },
    ],
  },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Roadmap() {
  const { currentUser } = useAuth();
  const uid = currentUser.uid;

  const [phases, setPhases] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [isStatic, setIsStatic] = useState(false);

  // roadmapProgress state
  const [completed, setCompleted] = useState({});
  const [activeDays, setActiveDays] = useState([]);

  // Load saved progress from Firestore
  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "roadmapProgress", uid));
      if (snap.exists()) {
        const data = snap.data();
        setCompleted(data.completed || {});
        setActiveDays(data.activeDays || []);
      }
      // Also try to load cached AI roadmap
      const assessSnap = await getDoc(doc(db, "assessments", uid));
      if (assessSnap.exists() && assessSnap.data().roadmapPhases) {
        setPhases(assessSnap.data().roadmapPhases);
        setIsStatic(false);
      } else {
        setPhases(STATIC_PHASES);
        setIsStatic(true);
      }
    }
    load();
  }, [uid]);

  const generateRoadmap = useCallback(async () => {
    setAiLoading(true);
    setAiError("");
    try {
      const assessSnap = await getDoc(doc(db, "assessments", uid));
      const result = assessSnap.exists() ? assessSnap.data().result : null;
      const topCareers = result?.topCareers?.map((c) => c.title).join(", ") || "undecided career";

      const prompt = `You are a career coach. Generate a personalized learning roadmap for someone whose top career matches are: ${topCareers}.

Return ONLY valid JSON, no markdown, no extra text:
{
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "blurb": "2-sentence description of this phase",
      "weeks": "Weeks 1–4",
      "skills": [
        { "id": "unique-slug-1", "label": "Skill Name" },
        { "id": "unique-slug-2", "label": "Skill Name" }
      ],
      "courses": [
        { "title": "Course Name", "provider": "Platform Name", "url": "https://example.com" },
        { "title": "Course Name", "provider": "Platform Name", "url": "https://example.com" }
      ]
    }
  ]
}
Generate 4 phases covering foundations, skill building, real-world experience, and career launch. Make skills and courses specific to ${topCareers}.`;

      const idToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt }),
      });

      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        setAiError(body.error ?? "Too many requests — try again later.");
        setAiLoading(false);
        setIsStatic(true);
        return;
      }
      if (!res.ok) {
        setAiError("Server error. Showing default roadmap.");
        setAiLoading(false);
        setIsStatic(true);
        return;
      }

      const data = await res.json();
      const raw = data?.content?.[0]?.text ?? "";
      const cleaned = raw.replace(/```json|```/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        setAiError("Couldn't parse AI response. Showing default roadmap.");
        setAiLoading(false);
        setIsStatic(true);
        setPhases(STATIC_PHASES);
        return;
      }

      const validation = RoadmapSchema.safeParse(parsed);
      if (!validation.success) {
        setAiError("AI returned an unexpected shape. Showing default roadmap.");
        setAiLoading(false);
        setIsStatic(true);
        setPhases(STATIC_PHASES);
        return;
      }

      const validated = validation.data;
      await setDoc(
        doc(db, "assessments", uid),
        { roadmapPhases: validated.phases },
        { merge: true }
      );

      setPhases(validated.phases);
      setIsStatic(false);
    } catch (err) {
      console.error("Roadmap generate error:", err);
      setAiError("Something went wrong. Showing default roadmap.");
      setIsStatic(true);
      setPhases(STATIC_PHASES);
    } finally {
      setAiLoading(false);
    }
  }, [uid]);

  const handleToggle = async (skillId) => {
    const next = { ...completed, [skillId]: !completed[skillId] };
    setCompleted(next);

    // Record today as an active day (dedupe)
    const today = todayStr();
    const nextDays = activeDays.includes(today) ? activeDays : [...activeDays, today];
    setActiveDays(nextDays);

    await setDoc(
      doc(db, "roadmapProgress", uid),
      { completed: next, activeDays: nextDays },
      { merge: true }
    );
  };

  // Streak computation
  function computeStreak(days) {
    if (!days.length) return 0;
    const sorted = [...days].sort().reverse();
    const today = todayStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = (prev - curr) / 86400000;
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  }

  function computeWeekCount(days) {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 86400000).toISOString().slice(0, 10);
    return days.filter((d) => d >= weekAgo).length;
  }

  const streak = computeStreak(activeDays);
  const weekCount = computeWeekCount(activeDays);

  const totalSkills = phases
    ? phases.flatMap((p) => p.skills).length
    : 0;
  const completedCount = Object.values(completed).filter(Boolean).length;
  const progress = totalSkills ? Math.round((completedCount / totalSkills) * 100) : 0;

  if (!phases) {
    return (
      <PageShell>
        <main style={centeredStyle}>
          <Spinner />
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main
        style={{
          padding: "56px clamp(20px, 6vw, 72px) 80px",
          maxWidth: 860,
          margin: "0 auto",
          fontFamily: "'Inter', sans-serif",
          color: C.ink,
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={eyebrow}>Your Learning Path</p>
          <h1 style={h1Style}>Career Roadmap</h1>
          <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.65, marginTop: 8 }}>
            Track your skills and courses phase by phase.
          </p>
        </div>

        {/* Streak + week badges */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
          <Badge emoji="🔥" text={`${streak}-day streak`} color={C.marigold} />
          <Badge emoji="📅" text={`${weekCount} skill${weekCount !== 1 ? "s" : ""} this week`} color={C.sage} />
          <Badge emoji="✅" text={`${completedCount}/${totalSkills} skills done`} color={C.ink} />
        </div>

        {/* Overall progress bar */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.mist}`,
            borderRadius: 14,
            padding: "16px 20px",
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>Overall progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.marigold }}>{progress}%</span>
          </div>
          <div
            style={{
              height: 8,
              background: C.mist,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: C.marigold,
                borderRadius: 999,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* AI error / fallback notice */}
        {aiError && (
          <div
            style={{
              background: `${C.marigold}12`,
              border: `1px solid ${C.marigold}44`,
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 24,
              fontSize: 13,
              color: C.ink,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>{aiError}</span>
            <button
              onClick={generateRoadmap}
              style={{
                background: C.marigold,
                border: "none",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 14px",
                borderRadius: 8,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Generate button (shown when on static fallback) */}
        {isStatic && !aiLoading && !aiError && (
          <div style={{ marginBottom: 28 }}>
            <button
              onClick={generateRoadmap}
              style={{
                padding: "13px 28px",
                borderRadius: 12,
                border: "none",
                background: C.marigold,
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
              }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Generate my roadmap →
            </button>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
              Uses your career assessment results to build a personalised path.
            </p>
          </div>
        )}

        {aiLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 28,
              padding: "16px 20px",
              background: "#fff",
              border: `1px solid ${C.mist}`,
              borderRadius: 14,
            }}
          >
            <Spinner small />
            <span style={{ fontSize: 14, color: C.muted }}>
              Building your personalised roadmap…
            </span>
          </div>
        )}

        {/* Phases */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {phases.map((ph) => {
            const phaseCompleted = ph.skills.filter((s) => completed[s.id]).length;
            const phaseTotal = ph.skills.length;
            return (
              <div
                key={ph.phase}
                style={{
                  background: "#fff",
                  border: `1px solid ${C.mist}`,
                  borderRadius: 18,
                  overflow: "hidden",
                }}
              >
                {/* Phase header */}
                <div
                  style={{
                    padding: "20px 24px 16px",
                    borderBottom: `1px solid ${C.mist}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: C.ink,
                          color: C.paper,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 800,
                          fontFamily: "'Fraunces', Georgia, serif",
                          flexShrink: 0,
                        }}
                      >
                        {ph.phase}
                      </span>
                      <h2
                        style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          fontSize: 18,
                          fontWeight: 800,
                          color: C.ink,
                          margin: 0,
                        }}
                      >
                        {ph.title}
                      </h2>
                    </div>
                    <p style={{ fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.55 }}>
                      {ph.blurb}
                    </p>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: C.sage,
                        background: `${C.sage}14`,
                        padding: "4px 10px",
                        borderRadius: 6,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      {ph.weeks}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>
                      {phaseCompleted}/{phaseTotal} skills
                    </span>
                  </div>
                </div>

                <div style={{ padding: "16px 24px 20px" }}>
                  {/* Skills */}
                  <p style={sectionLabel}>Skills</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {ph.skills.map((skill) => (
                      <label
                        key={skill.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "7px 14px",
                          borderRadius: 999,
                          border: `1.5px solid ${completed[skill.id] ? C.sage : C.mist}`,
                          background: completed[skill.id] ? `${C.sage}12` : C.paper,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: completed[skill.id] ? C.sage : C.ink,
                          transition: "all .15s",
                          userSelect: "none",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={!!completed[skill.id]}
                          onChange={() => handleToggle(skill.id)}
                          style={{ accentColor: C.sage, width: 14, height: 14 }}
                        />
                        {skill.label}
                      </label>
                    ))}
                  </div>

                  {/* Courses */}
                  <p style={sectionLabel}>Recommended Courses</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {ph.courses.map((course, ci) => (
                      <a
                        key={ci}
                        href={course.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1px solid ${C.mist}`,
                          textDecoration: "none",
                          background: C.paper,
                          gap: 8,
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.borderColor = C.marigold)
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.borderColor = C.mist)
                        }
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: C.ink,
                              marginBottom: 2,
                            }}
                          >
                            {course.title}
                          </div>
                          <div style={{ fontSize: 12, color: C.muted }}>
                            {course.provider}
                          </div>
                        </div>
                        <span style={{ color: C.marigold, fontSize: 14, flexShrink: 0 }}>→</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </PageShell>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <Navbar />
      {children}
    </div>
  );
}

function Badge({ emoji, text, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "6px 14px",
        borderRadius: 999,
        background: `${color}14`,
        color,
        fontSize: 13,
        fontWeight: 700,
        border: `1px solid ${color}30`,
      }}
    >
      {emoji} {text}
    </span>
  );
}

function Spinner({ small }) {
  const size = small ? 20 : 36;
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid ${C.mist}`,
        borderTop: `3px solid ${C.marigold}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

const centeredStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "60vh",
};

const eyebrow = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.sage,
  marginBottom: 10,
  margin: 0,
};

const h1Style = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: "clamp(28px, 5vw, 38px)",
  fontWeight: 900,
  color: C.ink,
  margin: "8px 0 0",
  lineHeight: 1.1,
};

const sectionLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: C.muted,
  margin: "0 0 8px",
};
