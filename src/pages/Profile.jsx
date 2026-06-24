import React, { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import { useAuth } from "../context/AuthContext";
import {
  doc, getDoc, setDoc, getDocs,
  collection, orderBy, query, deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { C, font } from "../theme";

const MAX_PHOTO_BYTES = 900 * 1024; // ~900 KB

function resizePhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const EMPTY_FORM = {
  name: "", age: "", role: "", location: "",
  hobbies: "", interests: "",
  careerWants: "", skillWants: "", bio: "",
  photo: "",
};

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const uid = currentUser.uid;
  const photoInputRef = useRef(null);

  const [form, setForm]         = useState(EMPTY_FORM);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const [assessments, setAssessments]     = useState([]);
  const [assessLoading, setAssessLoading] = useState(true);
  const [deletingId, setDeletingId]       = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Load profile on mount
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", uid)).then((snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      setForm({
        name:        d.name        || "",
        age:         d.age         || "",
        role:        d.role        || "",
        location:    d.location    || "",
        hobbies:     Array.isArray(d.hobbies)   ? d.hobbies.join(", ")   : (d.hobbies   || ""),
        interests:   Array.isArray(d.interests) ? d.interests.join(", ") : (d.interests || ""),
        careerWants: d.careerWants || "",
        skillWants:  d.skillWants  || "",
        bio:         d.bio         || "",
        photo:       d.photo       || "",
      });
      setIsPublic(d.public || false);
    });
  }, [currentUser, uid]);

  // Load assessments subcollection
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "assessments", uid, "items"), orderBy("createdAt", "desc"))
        );
        let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Legacy fallback: check old single-doc at assessments/{uid}
        if (items.length === 0) {
          const legacySnap = await getDoc(doc(db, "assessments", uid));
          if (legacySnap.exists()) {
            const d = legacySnap.data();
            if (d.title || d.result) {
              items = [{
                id: "legacy",
                title: d.title || "My first assessment",
                goal: d.goal || "career",
                result: d.result || null,
                roadmap: d.roadmap || null,
                createdAt: d.createdAt || null,
                isLegacy: true,
              }];
            }
          }
        }

        setAssessments(items);
      } catch (err) {
        console.error("Profile: failed to load assessments:", err);
      } finally {
        setAssessLoading(false);
      }
    };
    load();
  }, [currentUser, uid]);

  const handlePhotoSelect = async (e) => {
    setPhotoError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizePhoto(file);
      if (dataUrl.length > MAX_PHOTO_BYTES) {
        setPhotoError("Image too large, pick a smaller one.");
        return;
      }
      setForm((prev) => ({ ...prev, photo: dataUrl }));
    } catch {
      setPhotoError("Could not process this image. Please try another.");
    }
    e.target.value = "";
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const toSave = {
        name:        form.name,
        age:         form.age,
        role:        form.role,
        location:    form.location,
        hobbies:     form.hobbies.split(",").map((s) => s.trim()).filter(Boolean),
        interests:   form.interests.split(",").map((s) => s.trim()).filter(Boolean),
        careerWants: form.careerWants,
        skillWants:  form.skillWants,
        bio:         form.bio,
        photo:       form.photo || "",
        public:      isPublic,
      };
      await setDoc(doc(db, "users", uid), toSave, { merge: true });
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

  function formatDate(ts) {
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }

  const initial = (form.name || currentUser?.email || "U")[0].toUpperCase();

  return (
    <PageTransition>
      <style>{`
        .pf-input { width:100%; padding:12px 14px; border-radius:10px; border:1.5px solid ${C.mist}; background:${C.paper}; color:${C.ink}; font-size:15px; font-family:${font.body}; outline:none; box-sizing:border-box; transition:border-color .15s; }
        .pf-input:focus { border-color:${C.marigold}; }
        .pf-label { display:block; font-size:11px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; color:${C.muted}; margin-bottom:6px; transition:color .15s; }
        .pf-label.focused { color:${C.marigold}; }
        @media(prefers-reduced-motion:reduce){ .pf-input { transition:none; } }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.paper, fontFamily: font.body, color: C.ink }}>
        <Navbar />

        <main style={{ maxWidth: 800, margin: "0 auto", padding: "56px clamp(20px, 6vw, 48px) 80px" }}>

          {/* ── Profile card ── */}
          <div style={{ marginBottom: 56 }}>
            <p style={eyebrow}>Your Account</p>
            <h1 style={h1}>Profile</h1>
            <p style={{ color: C.muted, fontSize: 15, margin: "8px 0 28px", lineHeight: 1.6 }}>
              Keep this up to date — the AI uses it to personalise every assessment.
            </p>

            <div style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 18, padding: "28px 24px" }}>
              <form onSubmit={handleSave}>

                {/* Avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 28 }}>
                  <div
                    style={{
                      width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
                      background: form.photo ? "transparent" : `${C.marigold}22`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 28, fontWeight: 800, color: C.marigold,
                      overflow: "hidden", border: `2px solid ${C.mist}`,
                    }}
                  >
                    {form.photo
                      ? <img src={form.photo} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initial}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      style={{ padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${C.mist}`, background: "transparent", color: C.ink, fontFamily: font.body, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                    >
                      Change photo
                    </button>
                    {photoError && <p style={{ fontSize: 12, color: "#c0392b", margin: "6px 0 0" }}>{photoError}</p>}
                    <p style={{ fontSize: 11, color: C.muted, margin: "4px 0 0" }}>JPEG/PNG, max ~900 KB after resize.</p>
                    <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoSelect} />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* Row: name + age */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16 }}>
                    <Field id="name" label="Full name" form={form} setForm={setForm}
                      type="text" placeholder="e.g. Alex Sharma"
                      focused={focusedField} setFocused={setFocusedField} required />
                    <Field id="age" label="Age" form={form} setForm={setForm}
                      type="number" placeholder="e.g. 20"
                      focused={focusedField} setFocused={setFocusedField}
                      style={{ width: 90 }} required />
                  </div>

                  {/* Row: role + location */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
                    <Field id="role" label="Current role / year" form={form} setForm={setForm}
                      type="text" placeholder="e.g. B.Tech CSE, 2nd year"
                      focused={focusedField} setFocused={setFocusedField} />
                    <Field id="location" label="Location" form={form} setForm={setForm}
                      type="text" placeholder="e.g. Mumbai, India"
                      focused={focusedField} setFocused={setFocusedField} />
                  </div>

                  <Field id="hobbies" label="Hobbies (comma-separated)" form={form} setForm={setForm}
                    type="text" placeholder="e.g. Photography, hiking, chess"
                    focused={focusedField} setFocused={setFocusedField} />

                  <Field id="interests" label="Interests (comma-separated)" form={form} setForm={setForm}
                    type="text" placeholder="e.g. Machine learning, UX design, finance"
                    focused={focusedField} setFocused={setFocusedField} />

                  <TextareaField id="careerWants" label="What career or role are you aiming for?"
                    value={form.careerWants} rows={3}
                    placeholder="e.g. I want to become a product manager at a tech startup…"
                    onChange={(v) => setForm((p) => ({ ...p, careerWants: v }))}
                    focused={focusedField} setFocused={setFocusedField} />

                  <TextareaField id="skillWants" label="What skills do you most want to learn?"
                    value={form.skillWants} rows={3}
                    placeholder="e.g. System design, public speaking, data analysis…"
                    onChange={(v) => setForm((p) => ({ ...p, skillWants: v }))}
                    focused={focusedField} setFocused={setFocusedField} />

                  <TextareaField id="bio" label="Short bio (optional)"
                    value={form.bio} rows={2}
                    placeholder="A sentence about who you are…"
                    onChange={(v) => setForm((p) => ({ ...p, bio: v }))}
                    focused={focusedField} setFocused={setFocusedField} />

                  {/* Public toggle */}
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${isPublic ? C.sage : C.mist}`, background: isPublic ? `${C.sage}08` : C.paper, cursor: "pointer", transition: "border-color .15s, background .15s", userSelect: "none" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Public profile</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        Let others see your top match at{" "}
                        <span style={{ fontFamily: "monospace" }}>/u/{uid?.slice(0, 8)}…</span>
                      </div>
                    </div>
                    <div style={{ width: 44, height: 24, borderRadius: 12, background: isPublic ? C.sage : C.mist, position: "relative", flexShrink: 0, marginLeft: 16, transition: "background .2s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isPublic ? 23 : 3, transition: "left .2s" }} />
                      <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)}
                        style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", margin: 0 }} />
                    </div>
                  </label>

                  <button
                    type="submit"
                    disabled={saving}
                    style={{ padding: "13px", borderRadius: 12, border: "none", background: saved ? C.sage : saving ? `${C.marigold}88` : C.marigold, color: "#fff", fontFamily: font.body, fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", transition: "background .2s" }}
                  >
                    {saved ? "Saved ✓" : saving ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ── Assessments list ── */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <p style={eyebrow}>History</p>
                <h2 style={{ fontFamily: font.display, fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 900, color: C.ink, margin: 0, lineHeight: 1.1 }}>
                  My Assessments
                </h2>
              </div>
              <button
                onClick={() => navigate("/quiz-instructions")}
                style={{ padding: "11px 22px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: font.body, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
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
                <h3 style={{ fontFamily: font.display, fontSize: 20, fontWeight: 800, color: C.ink, margin: "0 0 10px" }}>
                  No assessments yet
                </h3>
                <p style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.65 }}>
                  Start your first assessment to discover career paths that match your strengths.
                </p>
                <button
                  onClick={() => navigate("/quiz-instructions")}
                  style={{ padding: "12px 28px", borderRadius: 12, border: "none", background: C.marigold, color: "#fff", fontFamily: font.body, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
                >
                  Start First Assessment →
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {assessments.map((item) => (
                  <div key={item.id} style={{ background: "#fff", border: `1px solid ${C.mist}`, borderRadius: 16, padding: "20px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                          <h3 style={{ fontFamily: font.display, fontSize: 16, fontWeight: 800, color: C.ink, margin: 0 }}>
                            {item.title || "Untitled Assessment"}
                          </h3>
                          <GoalBadge goal={item.goal} />
                          {item.isLegacy && (
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", background: C.muted, color: "#fff", padding: "3px 8px", borderRadius: 4 }}>Legacy</span>
                          )}
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

                      <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
                        {item.result ? (
                          <ActionBtn onClick={() => navigate(`/results?id=${item.id}`)}>View Report</ActionBtn>
                        ) : !item.isLegacy ? (
                          <ActionBtn onClick={() => navigate(`/assessment?id=${item.id}`)}>Continue →</ActionBtn>
                        ) : null}
                        {item.result && (
                          <ActionBtn onClick={() => navigate(`/roadmap?id=${item.id}`)}>Roadmap</ActionBtn>
                        )}
                        {item.isLegacy ? (
                          <p style={{ fontSize: 11, color: C.muted, margin: 0, lineHeight: 1.5 }}>
                            Take a new assessment to replace this.
                          </p>
                        ) : confirmDelete === item.id ? (
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: C.muted }}>Delete?</span>
                            <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                              style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: "#c0392b", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: font.body }}>
                              {deletingId === item.id ? "…" : "Yes"}
                            </button>
                            <button onClick={() => setConfirmDelete(null)}
                              style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.mist}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDelete(item.id)}
                            style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${C.mist}`, background: "transparent", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: font.body }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = "#c0392b"; e.currentTarget.style.color = "#c0392b"; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = C.mist; e.currentTarget.style.color = C.muted; }}>
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
    </PageTransition>
  );
}

// ── Field helpers ─────────────────────────────────────────────────────────────

function Field({ id, label, form, setForm, type, placeholder, focused, setFocused, style, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className={`pf-label${focused === id ? " focused" : ""}`}>{label}</label>
      <input
        id={id} type={type} required={required}
        placeholder={placeholder}
        value={form[id]}
        onChange={(e) => setForm((p) => ({ ...p, [id]: e.target.value }))}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        className="pf-input"
        style={style}
      />
    </div>
  );
}

function TextareaField({ id, label, value, onChange, rows, placeholder, focused, setFocused }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label htmlFor={id} className={`pf-label${focused === id ? " focused" : ""}`}>{label}</label>
      <textarea
        id={id} rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(id)}
        onBlur={() => setFocused(null)}
        className="pf-input"
        style={{ resize: "vertical", lineHeight: 1.6 }}
      />
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

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
    <button onClick={onClick}
      style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${C.ink}`, background: "transparent", color: C.ink, fontFamily: font.body, fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      onMouseOver={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.paper; }}
      onMouseOut={(e)  => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.ink; }}>
      {children}
    </button>
  );
}

function Spinner() {
  return <div style={{ width: 32, height: 32, border: `3px solid ${C.mist}`, borderTop: `3px solid ${C.marigold}`, borderRadius: "50%", animation: "spin 1s linear infinite" }} />;
}

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: C.sage, margin: 0 };
const h1      = { fontFamily: font.display, fontSize: "clamp(26px, 5vw, 34px)", fontWeight: 900, color: C.ink, margin: "8px 0 0", lineHeight: 1.1 };
