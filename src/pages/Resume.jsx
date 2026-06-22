import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

export default function Resume() {
  const { currentUser } = useAuth();
  const uid = currentUser.uid;

  const [profile, setProfile] = useState(null);
  const [result, setResult] = useState(null);
  const [completedSkills, setCompletedSkills] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [userSnap, assessSnap, progressSnap] = await Promise.all([
        getDoc(doc(db, "users", uid)),
        getDoc(doc(db, "assessments", uid)),
        getDoc(doc(db, "roadmapProgress", uid)),
      ]);

      const profileData = userSnap.exists() ? userSnap.data() : {};
      const assessData = assessSnap.exists() ? assessSnap.data() : {};
      const progressData = progressSnap.exists() ? progressSnap.data() : {};

      setProfile(profileData);
      setResult(assessData.result || null);

      // Map completed skill ids back to labels using roadmapPhases
      const roadmapPhases = assessData.roadmapPhases || [];
      setPhases(roadmapPhases);
      const completedMap = progressData.completed || {};
      const allSkills = roadmapPhases.flatMap((p) => p.skills);
      const done = allSkills
        .filter((s) => completedMap[s.id])
        .map((s) => s.label);
      setCompletedSkills(done);

      setLoading(false);
    }
    load();
  }, [uid]);

  if (loading) {
    return (
      <PageShell>
        <main style={centeredStyle}>
          <Spinner />
        </main>
      </PageShell>
    );
  }

  const name = profile?.name || currentUser.email?.split("@")[0] || "Your Name";
  const age = profile?.age || "";
  const role = profile?.role || "";
  const topCareer = result?.topCareers?.[0]?.title || "Career Goal";
  const strengths = result?.strengths || [];
  const skillsToLearn = result?.skillsToLearn || [];

  return (
    <>
      {/* Print stylesheet */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .resume-page {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Navbar hidden in print */}
      <div className="no-print">
        <Navbar />
      </div>

      <div
        style={{
          minHeight: "100vh",
          background: C.paper,
          fontFamily: "'Inter', sans-serif",
          padding: "40px clamp(16px, 5vw, 48px) 80px",
        }}
      >
        {/* Controls */}
        <div
          className="no-print"
          style={{
            maxWidth: 760,
            margin: "0 auto 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <p style={eyebrow}>Resume Builder</p>
            <h1 style={h1Style}>Your Resume</h1>
          </div>
          <button
            onClick={() => window.print()}
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
            Download PDF
          </button>
        </div>

        {/* Resume card */}
        <div
          className="resume-page"
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "#fff",
            border: `1px solid ${C.mist}`,
            borderRadius: 18,
            padding: "48px 52px",
            boxShadow: "0 4px 24px rgba(22,22,29,0.07)",
          }}
        >
          {/* Header */}
          <div
            style={{
              borderBottom: `2px solid ${C.marigold}`,
              paddingBottom: 20,
              marginBottom: 28,
            }}
          >
            <h1
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 30,
                fontWeight: 900,
                color: C.ink,
                margin: "0 0 4px",
              }}
            >
              {name}
            </h1>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: C.marigold,
                margin: "0 0 6px",
              }}
            >
              {topCareer}
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {age && (
                <span style={{ fontSize: 13, color: C.muted }}>Age: {age}</span>
              )}
              {role && (
                <span style={{ fontSize: 13, color: C.muted }}>{role}</span>
              )}
              <span style={{ fontSize: 13, color: C.muted }}>
                {currentUser.email}
              </span>
            </div>
          </div>

          {/* Career Objective */}
          {result?.summary && (
            <ResumeSection title="Career Objective">
              <p
                style={{
                  fontSize: 14,
                  color: C.ink,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {result.summary}
              </p>
            </ResumeSection>
          )}

          {/* Key Strengths */}
          {strengths.length > 0 && (
            <ResumeSection title="Key Strengths">
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 18,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: "4px 24px",
                }}
              >
                {strengths.map((s, i) => (
                  <li
                    key={i}
                    style={{ fontSize: 14, color: C.ink, lineHeight: 1.7 }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </ResumeSection>
          )}

          {/* Skills Completed */}
          {completedSkills.length > 0 && (
            <ResumeSection title="Completed Skills">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {completedSkills.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      background: `${C.sage}14`,
                      color: C.sage,
                      fontSize: 12,
                      fontWeight: 600,
                      border: `1px solid ${C.sage}30`,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Skills to Develop */}
          {skillsToLearn.length > 0 && (
            <ResumeSection title="Skills in Progress">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {skillsToLearn.map((s, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 999,
                      background: `${C.mist}`,
                      color: C.muted,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Top Career Matches */}
          {result?.topCareers && result.topCareers.length > 0 && (
            <ResumeSection title="Career Interests">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {result.topCareers.map((c, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 120,
                        height: 5,
                        background: C.mist,
                        borderRadius: 999,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${c.match}%`,
                          background: i === 0 ? C.marigold : C.sage,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 14, color: C.ink, fontWeight: 600 }}>
                      {c.title}
                    </span>
                    <span style={{ fontSize: 12, color: C.muted }}>{c.match}%</span>
                  </div>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: 32,
              paddingTop: 16,
              borderTop: `1px solid ${C.mist}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: C.muted,
                fontStyle: "italic",
              }}
            >
              Generated by Career Atlas
            </span>
            <span style={{ fontSize: 11, color: C.muted }}>
              {new Date().toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function ResumeSection({ title, children }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 15,
          fontWeight: 800,
          color: C.ink,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          margin: "0 0 10px",
          paddingBottom: 4,
          borderBottom: `1px solid ${C.mist}`,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function PageShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.paper }}>
      <Navbar />
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        border: `4px solid ${C.mist}`,
        borderTop: `4px solid ${C.marigold}`,
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
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
  margin: 0,
};

const h1Style = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: "clamp(24px, 4vw, 32px)",
  fontWeight: 900,
  color: C.ink,
  margin: "6px 0 0",
};
