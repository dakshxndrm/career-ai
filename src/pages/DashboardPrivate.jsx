import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, query, orderBy, limit, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

export default function DashboardPrivate() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser.uid;

  const [newestAssessment, setNewestAssessment] = useState(null); // { id, title, result, ... }
  const [savedCareers, setSavedCareers] = useState([]);
  const [loadingAssess, setLoadingAssess] = useState(true);

  const displayName = userData?.name || currentUser?.email?.split("@")[0] || "Explorer";

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, "assessments", uid, "items"),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          setNewestAssessment({ id: d.id, ...d.data() });
        }
      } catch (err) {
        console.error("DashboardPrivate: load newest assessment:", err);
      } finally {
        setLoadingAssess(false);
      }

      getDoc(doc(db, "users", uid)).then((snap) => {
        if (snap.exists()) setSavedCareers(snap.data().savedCareers || []);
      });
    };
    load();
  }, [currentUser, uid]);

  const latestId = newestAssessment?.id;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "'Inter', sans-serif", color: C.ink }}>
      <Navbar />

      <main style={{ padding: "64px clamp(24px, 8vw, 72px)", maxWidth: 1100, margin: "0 auto" }}>
        {/* Welcome header */}
        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sage, marginBottom: 10 }}>
            Your Dashboard
          </p>
          <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1.1 }}>
            Welcome back, <span style={{ color: C.marigold }}>{displayName}</span>.
          </h1>
          <p style={{ color: C.muted, fontSize: 16, marginTop: 10 }}>Here is your career overview and next steps.</p>
        </div>

        {/* Cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {/* Current focus */}
          <DashCard icon="🗺">
            <CardTitle>Current Focus</CardTitle>
            <p style={{ fontSize: 15, color: C.ink, fontWeight: 500, margin: 0 }}>{userData?.role || "Role not set"}</p>
            <Tag color={C.sage}>Active path</Tag>
          </DashCard>

          {/* Assessment CTA — ink hero card */}
          <div style={{ background: C.ink, borderRadius: 18, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
            <svg aria-hidden="true" style={{ position: "absolute", bottom: -20, right: -20, opacity: 0.07, pointerEvents: "none" }} width="160" height="160" viewBox="0 0 160 160">
              {[0,1,2,3].map((i) => <circle key={i} cx="140" cy="140" r={25+i*25} fill="none" stroke="#FAF8F3" strokeWidth="1" />)}
            </svg>
            <IconBox dark>🧭</IconBox>
            <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 800, color: C.paper, margin: 0 }}>Career Assessment</h3>
            <p style={{ fontSize: 14, color: C.mist, margin: 0, lineHeight: 1.6 }}>
              {newestAssessment
                ? `Latest: "${newestAssessment.title}"`
                : "Complete your AI-driven evaluation to unlock personalised job matches."}
            </p>
            <button
              onClick={() => navigate("/quiz-instructions")}
              style={{ alignSelf: "flex-start", marginTop: 4, padding: "11px 22px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              New Assessment →
            </button>
          </div>

          {/* Results shortcut */}
          <DashCard icon="📋">
            <CardTitle>Your Results</CardTitle>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>View your career report, top matches, and personal roadmap.</p>
            <OutlineBtn
              onClick={() => latestId ? navigate(`/results?id=${latestId}`) : navigate("/profile")}
              disabled={!latestId && !loadingAssess}
            >
              {loadingAssess ? "Loading…" : latestId ? "View Report →" : "No reports yet"}
            </OutlineBtn>
          </DashCard>

          {/* Roadmap shortcut */}
          <DashCard icon="📍">
            <CardTitle>Learning Roadmap</CardTitle>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>Track your skill phases, check off goals, and keep your streak alive.</p>
            <OutlineBtn
              onClick={() => latestId ? navigate(`/roadmap?id=${latestId}`) : navigate("/profile")}
              disabled={!latestId && !loadingAssess}
            >
              {loadingAssess ? "Loading…" : latestId ? "Open Roadmap →" : "No roadmap yet"}
            </OutlineBtn>
          </DashCard>

          {/* My Assessments shortcut */}
          <DashCard icon="📚">
            <CardTitle>My Assessments</CardTitle>
            <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>View all your past assessments, reports, and progress history.</p>
            <OutlineBtn onClick={() => navigate("/profile")}>View History →</OutlineBtn>
          </DashCard>
        </div>

        {/* Saved Careers */}
        {savedCareers.length > 0 && (
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 16 }}>
              Saved Careers
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {savedCareers.map((title) => (
                <button
                  key={title}
                  onClick={() => latestId ? navigate(`/results?id=${latestId}`) : navigate("/profile")}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, border: `1.5px solid ${C.marigold}`, background: `${C.marigold}10`, color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
                  onMouseOver={(e) => (e.currentTarget.style.background = `${C.marigold}20`)}
                  onMouseOut={(e) => (e.currentTarget.style.background = `${C.marigold}10`)}
                >
                  <span style={{ color: C.marigold }}>★</span>
                  {title}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ── Shared card primitives ────────────────────────────────────────────────────

function DashCard({ icon, children }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 18, padding: "28px 28px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
      <IconBox>{icon}</IconBox>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 800, color: C.ink, margin: 0 }}>{children}</h3>;
}

function Tag({ children, color }) {
  return (
    <span style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, background: `${color}14`, padding: "4px 10px", borderRadius: 6 }}>
      {children}
    </span>
  );
}

function OutlineBtn({ onClick, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ alignSelf: "flex-start", padding: "10px 20px", borderRadius: 12, border: `1.5px solid ${disabled ? C.mist : C.ink}`, background: "transparent", color: disabled ? C.muted : C.ink, fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, cursor: disabled ? "default" : "pointer" }}
      onMouseOver={(e) => { if (!disabled) { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; } }}
      onMouseOut={(e) => { if (!disabled) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; } }}
    >
      {children}
    </button>
  );
}

function IconBox({ children, dark }) {
  return (
    <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 10, background: dark ? "rgba(250,248,243,0.12)" : C.mist, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
      {children}
    </span>
  );
}
