import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
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

  const [form, setForm] = useState({ name: "", age: "", role: "", phone: "" });
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Pre-fill form from Firestore
  useEffect(() => {
    if (!currentUser) return;
    getDoc(doc(db, "users", currentUser.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setForm({
          name: data.name || "",
          age: data.age || "",
          role: data.role || "",
          phone: data.phone || "",
        });
        setIsPublic(data.public || false);
      }
    });
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { ...form, public: isPublic });
      navigate("/quiz-instructions");
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: "'Inter', sans-serif",
        color: C.ink,
      }}
    >
      <Navbar />

      <main
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "64px 24px 80px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 460 }}>
          {/* Header */}
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: C.sage,
              marginBottom: 10,
            }}
          >
            Step 1 of 3
          </p>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(26px, 5vw, 34px)",
              fontWeight: 900,
              color: C.ink,
              margin: "0 0 10px",
              lineHeight: 1.1,
            }}
          >
            Tell us about yourself.
          </h1>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 36, lineHeight: 1.6 }}>
            Your answers help the AI tailor every question to your background.
          </p>

          {/* Card */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${C.mist}`,
              borderRadius: 18,
              padding: "32px 28px",
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {FIELDS.map(({ key, label, type, placeholder }) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label
                    htmlFor={key}
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.10em",
                      textTransform: "uppercase",
                      color: focusedField === key ? C.marigold : C.muted,
                      transition: "color .15s",
                    }}
                  >
                    {label}
                  </label>
                  <input
                    id={key}
                    type={type}
                    required={key !== "phone"}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    onFocus={() => setFocusedField(key)}
                    onBlur={() => setFocusedField(null)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: `1.5px solid ${focusedField === key ? C.marigold : C.mist}`,
                      background: C.paper,
                      color: C.ink,
                      fontSize: 15,
                      fontFamily: "'Inter', sans-serif",
                      outline: "none",
                      transition: "border-color .15s",
                    }}
                  />
                </div>
              ))}

              {/* Public profile toggle */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: `1.5px solid ${isPublic ? C.sage : C.mist}`,
                  background: isPublic ? `${C.sage}08` : C.paper,
                  cursor: "pointer",
                  transition: "border-color .15s, background .15s",
                  userSelect: "none",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                    Public profile
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Allow others to view your top career match and progress at{" "}
                    <span style={{ fontFamily: "monospace" }}>
                      /u/{currentUser?.uid?.slice(0, 8)}…
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 12,
                    background: isPublic ? C.sage : C.mist,
                    position: "relative",
                    flexShrink: 0,
                    marginLeft: 16,
                    transition: "background .2s",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 3,
                      left: isPublic ? 23 : 3,
                      transition: "left .2s",
                    }}
                  />
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer", margin: 0 }}
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: "14px",
                  borderRadius: 12,
                  border: "none",
                  background: loading ? `${C.marigold}88` : C.marigold,
                  color: "#fff",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saving…" : "Continue to Assessment →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
