import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import {
  doc, getDoc, updateDoc, getDocs,
  collection, orderBy, query, deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

const FIELDS = [
  { key: "name",  label: "Full name",  type: "text",   placeholder: "e.g. Alex Sharma" },
  { key: "age",   label: "Age",        type: "number", placeholder: "e.g. 17" },
  { key: "role",  label: "Current role / year", type: "text", placeholder: "e.g. Grade 11 student" },
  { key: "phone", label: "Phone (optional)",    type: "tel",  placeholder: "+91 98765 43210" },
];

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser.uid;

  const [form, setForm] = useState({ name: "", age: "", role: "", phone: "" });
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const [assessments, setAssessments] = useState([]);
  const [assessLoading, setAssessLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // id to confirm

  // Load profile
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setForm({ name: data.name || "", age: data.age || "", role: data.role || "", phone: data.phone || "" });
        setIsPublic(data.public || false);
      }
    });
  }, [currentUser, uid]);

  // Load assessments subcollection
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const q = query(
          collection(db, "assessments", uid, "items"),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setAssessments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Profile: failed to load assessments:", err);
      } finally {
        setAssessLoading(false);
      }
    };
    load();
  }, [currentUser, uid]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", uid), { ...form, public: isPublic });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Profile: save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setConfirmDelete(null);
    try {
      await deleteDoc(doc(db, "assessments", uid, "items", id));
      setAssessments((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Profile: delete error:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // Compute progress % for an assessment item using roadmapProgress
  // We stored it during roadmap use; here we'll use roadmap field directly
  function progressPct(item) {
    const phases = item.roadmap;
    if (!phases || !Array.isArray(phases) || phases.length === 0) return null;
    // We don't have completed map here (would need another read), skip for now
    return null;
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: "'Inter', sans-serif", color: C.ink }}>
      <Navbar />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "56px clamp(20px, 6vw, 48px) 80px" }}>

        {/* ── Profile form ── */}
        <div style={{ marginBottom: 52 }}>
          <p style={eyebrow}>Your Account</p>
          <h1 style={h1Style}>Profile</h1>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 28, lineHeight: 1.6, marginTop: 8 }}>
            Update your details. These are used to personalise every assessment.
          </p>

          <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 18, padding: "28px 24px" }}>
            <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor={key} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: focusedField === key ? C.marigold : C.muted, transition: "color .15s" }}>
                    {label}
                  </label>
                  <input
                    id={key}
                    type={type}
                    required={key !== "phone"}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                    style={{ padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${focusedField === key ? C.marigold : C.mist}`, background: C.paper, color: C.ink, fontSize: 15, fontFamily: "'Inter', sans-serif", outline: "none", transition: "border-color .15s" }}
                  />
                </div>
              ))}

              {/* Public toggle */}
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${isPublic ? C.sage : C.mist}`, background: isPublic ? `${C.sage}08` : C.paper, cursor: "pointer", transition: "border-color .15s, background .15s", userSelect: "none" }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Public profile</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Allow others to view your top career match and progress at{" "}
                    <span style={{ fontFamily: "monospace" }}>/u/{uid?.slice(0, 8)}…</span>
                  </div>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 12, background: isPublic ? C.sage : C.mist, position: "relative", flexShrink: 0, marginLeft: 16, transition: "background .2s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isPublic ? 23 : 3, transition: "left .2s" }} />
                  <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", margin: 0 }} />
                </div>
              </label>

              <button
                type="submit"
                disabled={saving}
                style={{ padding: "13px", borderRadius: 12, border: "none", background: saved ? C.sage : saving ? `${C.marigold}88` : C.marigold, color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", transition: "background .2s" }}
              >
                {saved ? "Saved ✓" : saving ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </div>
        </div>

        {/* ── Assessments list ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div>
              <p style={eyebrow}>History</p>
              <h2 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1.1 }}>
                My Assessments
              </h2>
            </div>
            <button
              onClick={() => navigate("/quiz-instructions")}
              style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
              onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            >
              + Start new assessment
            </button>
          </div>

          {assessLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spinner /></div>
          ) : assessments.length === 0 ? (
            <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 16, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }} aria-hidden="true">🧭</div>
              <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 20, fontWeight: 800, color: C.ink, margin: "0 0 10px" }}>
                No assessments yet
              </h3>
              <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.65 }}>
                Start your first assessment to discover career paths that match your strengths.
              </p>
              <button
                onClick={() => navigate("/quiz-instructions")}
                style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: "'Inter', sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              >
                Start First Assessment →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {assessments.map((item) => (
                <div
                  key={item.id}
                  style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 16, padding: "20px 22px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <h3 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>
                          {item.title || "Untitled Assessment"}
                        </h3>
                        <GoalBadge goal={item.goal} />
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: C.muted }}>{formatDate(item.createdAt)}</span>
                        {item.result ? (
                          <span style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>✓ Report ready</span>
                        ) : item.questions?.length > 0 ? (
                          <span style={{ fontSize: 12, color: C.marigold, fontWeight: 600 }}>In progress</span>
                        ) : (
                          <span style={{ fontSize: 12, color: C.muted }}>Not started</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                      {item.result ? (
                        <ActionBtn onClick={() => navigate(`/results?id=${item.id}`)}>View Report</ActionBtn>
                      ) : (
                        <ActionBtn onClick={() => navigate(`/assessment?id=${item.id}`)}>Continue →</ActionBtn>
                      )}
                      {item.result && (
                        <ActionBtn onClick={() => navigate(`/roadmap?id=${item.id}`)}>Roadmap</ActionBtn>
                      )}
                      {confirmDelete === item.id ? (
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: C.muted }}>Delete?</span>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                          >
                            {deletingId === item.id ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.mist}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(item.id)}
                          style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.mist}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
                          onMouseOver={(e) => { e.currentTarget.style.borderColor = "#c0392b"; e.currentTarget.style.color = "#c0392b"; }}
                          onMouseOut={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.color = C.muted; }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function GoalBadge({ goal }) {
  const isCareer = goal === "career";
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: isCareer ? C.marigold : C.sage, background: isCareer ? `${C.marigold}18` : `${C.sage}14`, padding: "3px 8px", borderRadius: 4 }}>
      {isCareer ? "Career" : "Skill"}
    </span>
  );
}

function ActionBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.ink}`, background: "transparent", color: C.ink, fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      onMouseOver={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; }}
      onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; }}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return <div style={{ width: 32, height: 32, border: `3px solid ${C.mist}`, borderTop: `3px solid ${C.marigold}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />;
}

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sage, margin: 0 };
const h1Style = { fontFamily: "'Fraunces', Georgia, serif", fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 900, color: C.ink, margin: "8px 0 0", lineHeight: 1.1 };
