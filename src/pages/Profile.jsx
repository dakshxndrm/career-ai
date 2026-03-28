import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    age: "",
    role: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

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

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div style={styles.container}>
      <Navbar />
      
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.header}>
            <h1 style={styles.title}>Complete Your Profile</h1>
            <p style={styles.subtitle}>Help our AI tailor your career path.</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {["name", "age", "role", "phone"].map((field) => (
              <div key={field} style={styles.inputGroup}>
                <label style={styles.label}>{field.toUpperCase()}</label>
                <input
                  type={field === "age" ? "number" : "text"}
                  required
                  placeholder={`Enter your ${field}`}
                  style={styles.input}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              </div>
            ))}

            <button 
              type="submit" 
              disabled={loading}
              style={loading ? {...styles.button, opacity: 0.7} : styles.button}
            >
              {loading ? "Saving..." : "Generate My Career Path →"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", // Light Teal to Light Blue
    fontFamily: "'Inter', sans-serif",
  },
  main: {
    display: "flex",
    justifyContent: "center",
    padding: "60px 20px",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "24px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
    width: "100%",
    maxWidth: "480px",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a", // Dark Slate
    marginBottom: "8px",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "14px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#0d9488", // Teal 600
    letterSpacing: "0.05em",
  },
  input: {
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    fontSize: "16px",
    outline: "none",
    transition: "border-color 0.2s",
    backgroundColor: "#f8fafc",
  },
  button: {
    marginTop: "10px",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    backgroundColor: "#0d9488", // Primary Teal
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)",
    transition: "transform 0.2s, background-color 0.2s",
  },
};