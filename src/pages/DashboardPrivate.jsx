import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  collection, query, orderBy, limit, getDocs,
  doc, getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { C, font } from "../theme";
import { fetchLegacyAssessment } from "../utils/assessments";
import { computeStreak } from "../utils/roadmapUtils";

export default function DashboardPrivate() {
  const { userData, currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser.uid;

  const [current, setCurrent]       = useState(null);   // { id, title, goal, result, roadmap }
  const [progress, setProgress]     = useState(null);   // { pct, completed, total, streak }
  const [totalCount, setTotalCount] = useState(0);
  const [savedCareers, setSavedCareers] = useState([]);
  const [loading, setLoading]       = useState(true);

  const displayName = userData?.name || currentUser?.email?.split("@")[0] || "Explorer";

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        // Fetch user doc for savedCareers + currentPathId
        const userSnap = await getDoc(doc(db, "users", uid));
        const userData2 = userSnap.exists() ? userSnap.data() : {};
        setSavedCareers(userData2.savedCareers || []);
        const currentPathId = userData2.currentPathId || null;

        // Count total assessments
        const allSnap = await getDocs(collection(db, "assessments", uid, "items"));
        setTotalCount(allSnap.size);

        // Resolve the assessment to show in the hero
        let heroItem = null;
        if (currentPathId) {
          const pathSnap = await getDoc(doc(db, "assessments", uid, "items", currentPathId));
          if (pathSnap.exists()) heroItem = { id: pathSnap.id, ...pathSnap.data() };
        }
        if (!heroItem) {
          const newestQ = query(
            collection(db, "assessments", uid, "items"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const snap = await getDocs(newestQ);
          if (!snap.empty) heroItem = { id: snap.docs[0].id, ...snap.docs[0].data() };
        }

        // Legacy fallback: check old single-doc at assessments/{uid}
        if (!heroItem) {
          heroItem = await fetchLegacyAssessment(uid);
          if (heroItem) setTotalCount(1);
        }

        setCurrent(heroItem);

        // Load roadmap progress for hero item
        if (heroItem) {
          const progSnap = await getDoc(doc(db, "roadmapProgress", uid, "items", heroItem.id));
          const progData = progSnap.exists() ? progSnap.data() : {};
          const completed = progData.completed || {};
          const activeDays = progData.activeDays || [];

          const phases = heroItem.roadmap || [];
          let total = 0;
          phases.forEach((ph) => { total += (ph.skills?.length || 0); });
          const doneCount = Object.values(completed).filter(Boolean).length;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          setProgress({ pct, completed: doneCount, total, streak: computeStreak(activeDays) });
        }
      } catch (err) {
        console.error("DashboardPrivate:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, uid]);

  const heroId = current?.id;

  return (
    <div className="page-enter">
      <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink }}>
        <Navbar />

        <main style={{ padding: "52px clamp(24px, 8vw, 72px) 80px", maxWidth: 1100, margin: "0 auto" }}>

          {/* Welcome header */}
          <div style={{ marginBottom: 40 }}>
            <p style={eyebrow}>Your Dashboard</p>
            <h1 style={{ fontFamily: font.display, fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 900, color: C.ink, margin: "6px 0 0", lineHeight: 1.1 }}>
              Welcome back, <span style={{ color: C.marigold }}>{displayName}</span>.
            </h1>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
          ) : totalCount === 0 ? (
            /* ── Empty state ── */
            <div style={{ background: C.ink, borderRadius: 20, padding: "clamp(32px, 6vw, 48px) clamp(24px, 5vw, 40px)", textAlign: "center", maxWidth: 560, position: "relative", overflow: "hidden" }}>
              <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 560 280" preserveAspectRatio="xMidYMid slice">
                {[0,1,2,3].map((i) => <ellipse key={i} cx="280" cy="280" rx={60+i*55} ry={30+i*25} fill="none" stroke={C.paper} strokeWidth=".7" opacity={.06-i*.01} />)}
              </svg>
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 40, marginBottom: 20 }} aria-hidden="true">🧭</div>
                <h2 style={{ fontFamily: font.display, fontSize: 26, fontWeight: 900, color: C.paper, margin: "0 0 12px" }}>
                  Start your first assessment
                </h2>
                <p style={{ fontSize: 15, color: C.mist, lineHeight: 1.7, margin: "0 0 28px" }}>
                  Answer 20+ personalised questions and get your AI career report + roadmap.
                </p>
                <button onClick={() => navigate("/quiz-instructions")}
                  style={{ padding: "14px 36px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: font.body, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  Take Assessment →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Hero: Current Path ── */}
              {current && (
                <div style={{ background: C.ink, borderRadius: 20, padding: "32px clamp(20px, 5vw, 36px)", marginBottom: 28, position: "relative", overflow: "hidden" }}>
                  <svg aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 900 260" preserveAspectRatio="xMidYMid slice">
                    {[0,1,2,3].map((i) => <ellipse key={`a${i}`} cx="820" cy="230" rx={70+i*65} ry={36+i*28} fill="none" stroke={C.paper} strokeWidth=".8" opacity={.06-i*.01} transform="rotate(-12 820 230)" />)}
                    {[0,1,2].map((i) => <ellipse key={`b${i}`} cx="80"  cy="20"  rx={50+i*50} ry={25+i*20} fill="none" stroke={C.paper} strokeWidth=".8" opacity={.05-i*.01} />)}
                  </svg>

                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.marigold, margin: 0 }}>Current Path</p>
                      <GoalBadge goal={current.goal} />
                    </div>
                    <h2 style={{ fontFamily: font.display, fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: C.paper, margin: "0 0 6px", lineHeight: 1.15 }}>
                      {current.title}
                    </h2>
                    {current.result?.topCareers?.[0]?.title && (
                      <p style={{ fontSize: 14, color: C.mist, margin: "0 0 20px" }}>
                        Top match: <strong style={{ color: C.paper }}>{current.result.topCareers[0].title}</strong>
                      </p>
                    )}

                    {/* Progress bar */}
                    {progress && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.mist, marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                          <span>{progress.completed}/{progress.total} skills complete</span>
                          <span>{progress.pct}% done {progress.streak > 0 && `· 🔥 ${progress.streak}-day streak`}</span>
                        </div>
                        <div style={{ height: 6, background: "rgba(250,248,243,0.15)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${progress.pct}%`, background: C.marigold, borderRadius: 999, transition: "width .5s ease" }} />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        onClick={() => current.result ? navigate(`/results?id=${heroId}`) : navigate(`/assessment?id=${heroId}`)}
                        style={{ padding: "11px 24px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: font.body, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
                        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
                      >
                        {current.result ? "View Report →" : "Continue →"}
                      </button>
                      <button
                        onClick={() => navigate(`/roadmap?id=${heroId}`)}
                        style={{ padding: "11px 24px", borderRadius: 12, border: `1.5px solid rgba(232,228,218,0.35)`, background: "transparent", color: C.paper, fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
                        onMouseOver={(e) => (e.currentTarget.style.borderColor = C.marigold)}
                        onMouseOut={(e) => (e.currentTarget.style.borderColor = "rgba(232,228,218,0.35)")}
                      >
                        Open Roadmap
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Stat tiles ── */}
              {progress && (
                <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
                  {[
                    { label: "Progress",         value: `${progress.pct}%`         },
                    { label: "Skills done",       value: `${progress.completed}/${progress.total}` },
                    { label: "Day streak",        value: progress.streak > 0 ? `🔥 ${progress.streak}` : "—" },
                    { label: "Assessments taken", value: totalCount                 },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 14, padding: "18px 20px" }}>
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: C.muted, margin: "0 0 8px" }}>{label}</p>
                      <p style={{ fontFamily: font.display, fontSize: 26, fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1 }}>{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Quick actions ── */}
              <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 18, marginBottom: 28 }}>
                <QuickCard icon="🧭" title="New Assessment"
                  body="Start a fresh AI-powered quiz to explore a new career or skill."
                  btnLabel="Start →" onClick={() => navigate("/quiz-instructions")} />
                <QuickCard icon="🗺️" title="My Plans"
                  body="See all your assessments, set your active path, and browse roadmaps."
                  btnLabel="View Plans →" onClick={() => navigate("/plans")} />
                <QuickCard icon="📚" title="Resources"
                  body="Curated courses, YouTube playlists, and free guides for your path."
                  btnLabel="Browse →" onClick={() => navigate("/resources")} />
              </div>

              {/* ── Saved careers ── */}
              {savedCareers.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <h2 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 800, color: C.ink, marginBottom: 14 }}>
                    Saved Careers
                  </h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {savedCareers.map((title) => (
                      <button key={title}
                        onClick={() => heroId ? navigate(`/results?id=${heroId}`) : navigate("/profile")}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999, border: `1.5px solid ${C.marigold}`, background: `${C.marigold}10`, color: C.ink, fontFamily: font.body, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background .15s" }}
                        onMouseOver={(e) => (e.currentTarget.style.background = `${C.marigold}20`)}
                        onMouseOut={(e) => (e.currentTarget.style.background = `${C.marigold}10`)}>
                        <span style={{ color: C.marigold }}>★</span>
                        {title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function GoalBadge({ goal }) {
  const isCareer = goal === "career";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: isCareer ? C.marigold : C.sage, background: isCareer ? `${C.marigold}28` : `${C.sage}28`, padding: "3px 8px", borderRadius: 4 }}>
      {isCareer ? "Career" : "Skill"}
    </span>
  );
}

function QuickCard({ icon, title, body, btnLabel, onClick }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 18, padding: "28px 26px", display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 6px rgba(22,22,29,.04)" }}>
      <span style={{ width: 44, height: 44, borderRadius: 10, background: C.mist, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }} aria-hidden="true">{icon}</span>
      <h3 style={{ fontFamily: font.display, fontSize: 18, fontWeight: 800, color: C.ink, margin: 0 }}>{title}</h3>
      <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>{body}</p>
      <button onClick={onClick}
        style={{ alignSelf: "flex-start", marginTop: 4, padding: "10px 20px", borderRadius: 12, border: `1.5px solid ${C.ink}`, background: "transparent", color: C.ink, fontFamily: font.body, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
        onMouseOver={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; }}
        onMouseOut={(e)  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; }}>
        {btnLabel}
      </button>
    </div>
  );
}

function Spinner() {
  return <div style={{ width: 36, height: 36, border: `3px solid ${C.mist}`, borderTop: `3px solid ${C.marigold}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />;
}

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sage, margin: 0 };
