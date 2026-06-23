import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  collection, query, orderBy, getDocs,
  doc, getDoc, setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { C, font } from "../theme";

export default function Plans() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser.uid;

  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [expandedId, setExpandedId]     = useState(null);
  const [currentPathId, setCurrentPathId] = useState(null);
  const [settingId, setSettingId]       = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        // Load assessments
        const snap = await getDocs(
          query(collection(db, "assessments", uid, "items"), orderBy("createdAt", "desc"))
        );
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Load roadmap progress for each in parallel
        const progResults = await Promise.all(
          list.map((item) =>
            getDoc(doc(db, "roadmapProgress", uid, "items", item.id)).then((s) => {
              if (!s.exists()) return { id: item.id, pct: 0 };
              const d = s.data();
              const completed = d.completed || {};
              const phases = item.roadmap || [];
              let total = 0;
              phases.forEach((ph) => { total += (ph.skills?.length || 0); });
              const done = Object.values(completed).filter(Boolean).length;
              return { id: item.id, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
            })
          )
        );
        const progMap = Object.fromEntries(progResults.map(({ id, pct }) => [id, pct]));

        setItems(list.map((item) => ({ ...item, pct: progMap[item.id] ?? 0 })));

        // Load current path id
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) setCurrentPathId(userSnap.data().currentPathId || null);
      } catch (err) {
        console.error("Plans:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser, uid]);

  const handleSetPath = async (id) => {
    setSettingId(id);
    try {
      await setDoc(doc(db, "users", uid), { currentPathId: id }, { merge: true });
      setCurrentPathId(id);
    } catch (err) {
      console.error("Plans: setCurrentPath:", err);
    } finally {
      setSettingId(null);
    }
  };

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink }}>
        <Navbar />

        <main style={{ maxWidth: 860, margin: "0 auto", padding: "56px clamp(20px, 6vw, 48px) 80px" }}>
          <p style={eyebrow}>Your progress</p>
          <h1 style={h1}>My Plans</h1>
          <p style={{ color: C.muted, fontSize: 15, margin: "8px 0 36px", lineHeight: 1.6 }}>
            Review all your assessments, choose your active path, and see the roadmap you'll follow.
          </p>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><Spinner /></div>
          ) : items.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 18, padding: "56px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }} aria-hidden="true">🧭</div>
              <h2 style={{ fontFamily: font.display, fontSize: 22, fontWeight: 800, color: C.ink, margin: "0 0 10px" }}>No assessments yet</h2>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.65 }}>
                Take your first assessment to get a personalised career or skill roadmap.
              </p>
              <button onClick={() => navigate("/quiz-instructions")}
                style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: font.body, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Start First Assessment →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {items.map((item) => {
                const isCurrent = item.id === currentPathId;
                const expanded  = expandedId === item.id;
                return (
                  <div key={item.id}
                    style={{ background: "#fff", border: `1.5px solid ${isCurrent ? C.marigold : C.mist}`, borderRadius: 18, overflow: "hidden", boxShadow: isCurrent ? `0 0 0 3px ${C.marigold}22` : "none", transition: "border-color .2s, box-shadow .2s" }}>

                    {/* Card header */}
                    <div style={{ padding: "22px 24px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                            {isCurrent && (
                              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", background: C.marigold, color: "#fff", padding: "3px 8px", borderRadius: 4 }}>Active</span>
                            )}
                            <GoalBadge goal={item.goal} />
                          </div>
                          <h2 style={{ fontFamily: font.display, fontSize: 18, fontWeight: 800, color: C.ink, margin: "0 0 4px" }}>
                            {item.title || "Untitled"}
                          </h2>
                          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{formatDate(item.createdAt)}</p>

                          {/* Progress bar */}
                          <div style={{ marginTop: 14 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 6 }}>
                              <span>Roadmap progress</span>
                              <span style={{ fontWeight: 700, color: C.ink }}>{item.pct}%</span>
                            </div>
                            <div style={{ height: 5, background: C.mist, borderRadius: 999, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${item.pct}%`, background: C.marigold, borderRadius: 999 }} />
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, alignItems: "flex-end" }}>
                          <button
                            onClick={() => handleSetPath(item.id)}
                            disabled={isCurrent || settingId === item.id}
                            style={{
                              padding: "9px 18px", borderRadius: 10,
                              border: "none",
                              background: isCurrent ? `${C.sage}18` : C.marigold,
                              color: isCurrent ? C.sage : "#fff",
                              fontFamily: font.body, fontSize: 13, fontWeight: 700,
                              cursor: isCurrent ? "default" : "pointer", whiteSpace: "nowrap",
                            }}
                          >
                            {settingId === item.id ? "Setting…" : isCurrent ? "✓ Current path" : "Set as current path"}
                          </button>
                          <div style={{ display: "flex", gap: 8 }}>
                            {item.result && (
                              <SmallBtn onClick={() => navigate(`/results?id=${item.id}`)}>View Report</SmallBtn>
                            )}
                            {item.result && (
                              <SmallBtn onClick={() => navigate(`/roadmap?id=${item.id}`)}>Open Roadmap</SmallBtn>
                            )}
                            {!item.result && (
                              <SmallBtn onClick={() => navigate(`/assessment?id=${item.id}`)}>Continue →</SmallBtn>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpandedId(expanded ? null : item.id)}
                        style={{ marginTop: 14, background: "none", border: "none", padding: "4px 0", color: C.muted, fontFamily: font.body, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
                        aria-expanded={expanded}
                      >
                        <span style={{ fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
                        {expanded ? "Hide roadmap steps" : "View roadmap steps"}
                      </button>
                    </div>

                    {/* Expanded roadmap */}
                    {expanded && (
                      <div style={{ borderTop: `1px solid ${C.mist}`, background: `${C.mist}44`, padding: "20px 24px" }}>
                        {!item.roadmap ? (
                          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
                            Roadmap not generated yet — <button onClick={() => navigate(`/roadmap?id=${item.id}`)} style={{ background: "none", border: "none", padding: 0, color: C.marigold, fontWeight: 600, cursor: "pointer", fontFamily: font.body, fontSize: 13 }}>open it to generate</button>.
                          </p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {item.roadmap.map((phase, i) => (
                              <div key={phase.phase || i}>
                                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: C.sage, margin: "0 0 4px" }}>
                                  Phase {phase.phase}: {phase.title}
                                </p>
                                <p style={{ fontSize: 13, color: C.muted, margin: "0 0 8px", lineHeight: 1.5 }}>{phase.blurb}</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                  {phase.skills?.map((s) => (
                                    <span key={s.id} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, background: "#fff", border: `1px solid ${C.mist}`, color: C.ink }}>
                                      {s.label}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 36, textAlign: "center" }}>
            <button onClick={() => navigate("/quiz-instructions")}
              style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: font.body, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
              + Start new assessment
            </button>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

function GoalBadge({ goal }) {
  const isCareer = goal === "career";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: isCareer ? C.marigold : C.sage, background: isCareer ? `${C.marigold}18` : `${C.sage}14`, padding: "3px 8px", borderRadius: 4 }}>
      {isCareer ? "Career" : "Skill"}
    </span>
  );
}

function SmallBtn({ onClick, children }) {
  return (
    <button onClick={onClick}
      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.ink}`, background: "transparent", color: C.ink, fontFamily: font.body, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
      onMouseOver={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; }}
      onMouseOut={(e)  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; }}>
      {children}
    </button>
  );
}

function Spinner() {
  return <div style={{ width: 36, height: 36, border: `3px solid ${C.mist}`, borderTop: `3px solid ${C.marigold}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />;
}

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: C.sage, margin: 0 };
const h1      = { fontFamily: font.display, fontSize: "clamp(26px,5vw,34px)", fontWeight: 900, color: C.ink, margin: "8px 0 0", lineHeight: 1.1 };
