import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
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
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), form);
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
