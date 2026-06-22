import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useParams, Link } from "react-router-dom";
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

export default function PublicProfile() {
  const { uid } = useParams();
  const [status, setStatus] = useState("loading"); // loading | found | private | not_found
  const [profile, setProfile] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    async function load() {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (!userSnap.exists()) {
        setStatus("not_found");
        return;
      }
      const data = userSnap.data();
      if (!data.public) {
        setStatus("private");
        return;
      }
      setProfile(data);

      const [assessSnap, progressSnap] = await Promise.all([
        getDoc(doc(db, "assessments", uid)),
        getDoc(doc(db, "roadmapProgress", uid)),
      ]);

      setAssessment(assessSnap.exists() ? assessSnap.data() : null);
      setProgress(progressSnap.exists() ? progressSnap.data() : null);
      setStatus("found");
    }
    load();
  }, [uid]);

  if (status === "loading") {
    return (
      <PageShell>
        <main style={centeredStyle}>
          <Spinner />
        </main>
      </PageShell>
    );
  }

  if (status === "private" || status === "not_found") {
    return (
      <PageShell>
        <main style={centeredStyle}>
          <div
            style={{
              textAlign: "center",
              padding: 48,
              background: "#fff",
              borderRadius: 20,
              border: `1px solid ${C.mist}`,
              maxWidth: 400,
              width: "100%",
            }}
          >
            <div
              style={{
                fontSize: 40,
                marginBottom: 16,
              }}
              aria-hidden="true"
            >
              {status === "private" ? "🔒" : "🗺"}
            </div>
            <h2
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 22,
                fontWeight: 800,
                color: C.ink,
                margin: "0 0 10px",
              }}
            >
              {status === "private"
                ? "This profile is private"
                : "Profile not found"}
            </h2>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.65, margin: "0 0 24px" }}>
              {status === "private"
                ? "The user has chosen to keep their profile private."
                : "We couldn't find this user."}
            </p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                padding: "11px 24px",
                borderRadius: 12,
                background: C.marigold,
                color: "#fff",
                textDecoration: "none",
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              Go home
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  // Compute progress %
  const roadmapPhases = assessment?.roadmapPhases || [];
  const allSkills = roadmapPhases.flatMap((p) => p.skills);
  const completedMap = progress?.completed || {};
  const completedCount = allSkills.filter((s) => completedMap[s.id]).length;
  const progressPct = allSkills.length
    ? Math.round((completedCount / allSkills.length) * 100)
    : 0;

  const topCareer = assessment?.result?.topCareers?.[0];
  const displayName = profile.name || "Explorer";

  return (
    <PageShell>
      <main
        style={{
          padding: "56px clamp(20px, 6vw, 72px) 80px",
          maxWidth: 680,
          margin: "0 auto",
          fontFamily: "'Inter', sans-serif",
          color: C.ink,
        }}
      >
        {/* Profile card */}
        <div
          style={{
            background: "#fff",
            border: `1px solid ${C.mist}`,
            borderRadius: 20,
            padding: "36px 36px 28px",
            marginBottom: 24,
          }}
        >
          {/* Avatar + name */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
            <span
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: `${C.marigold}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                fontWeight: 700,
                color: C.marigold,
                fontFamily: "'Fraunces', Georgia, serif",
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              {displayName[0].toUpperCase()}
            </span>
            <div>
              <h1
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: "clamp(22px, 4vw, 28px)",
                  fontWeight: 900,
                  color: C.ink,
                  margin: "0 0 4px",
                }}
              >
                {displayName}
              </h1>
              {profile.role && (
                <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{profile.role}</p>
              )}
            </div>
          </div>

          {/* Top career */}
          {topCareer && (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: `${C.marigold}10`,
                border: `1px solid ${C.marigold}30`,
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: C.marigold, margin: "0 0 4px" }}>
                Top Career Match
              </p>
              <p style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: 0 }}>
                {topCareer.title}
              </p>
            </div>
          )}

          {/* Progress */}
          {allSkills.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>
                  Roadmap progress
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.sage }}>
                  {progressPct}%
                </span>
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
                    width: `${progressPct}%`,
                    background: C.sage,
                    borderRadius: 999,
                  }}
                />
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                {completedCount} of {allSkills.length} skills completed
              </p>
            </div>
          )}
        </div>

        {/* Strengths */}
        {assessment?.result?.strengths?.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: `1px solid ${C.mist}`,
              borderRadius: 16,
              padding: "20px 24px",
            }}
          >
            <h2
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 16,
                fontWeight: 800,
                color: C.ink,
                margin: "0 0 12px",
              }}
            >
              Strengths
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {assessment.result.strengths.map((s, i) => (
                <span
                  key={i}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: `${C.marigold}14`,
                    color: C.marigold,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </main>
    </PageShell>
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
  minHeight: "70vh",
  padding: 24,
};
