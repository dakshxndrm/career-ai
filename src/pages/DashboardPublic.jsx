import React from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function DashboardPublic() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStartQuiz = () => {
    if (currentUser) {
      navigate("/profile");
    } else {
      navigate("/login");
    }
  };

  const handleMyDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div
      style={{
        background: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar />

      {/* ================= HERO SECTION ================= */}
      <section style={styles.hero}>
        <span style={styles.badge}>🚀 AI-Powered Career Pathfinding</span>

        <h1 style={styles.heroTitle}>Ready to discover your future?</h1>

        <p style={styles.heroSubtitle}>
          Discover your strengths across academics, arts, and skills.
          Career AI helps you choose the right path with confidence.
        </p>

        {/* CTA BUTTONS */}
        <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
          <button onClick={handleStartQuiz} style={styles.whiteBtn}>
            Start Quiz 🧠
          </button>

          {currentUser && (
            <button onClick={handleMyDashboard} style={styles.outlineBtn}>
              My Dashboard →
            </button>
          )}
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <main
        style={{
          padding: "80px 96px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <h2 style={styles.sectionTitle}>Explore Your Options</h2>

        <div style={styles.grid}>
          <Feature
            icon="🧠"
            title="Career Quiz"
            tag="Start Now"
            desc="AI-driven assessment for your future."
          />
          <Feature
            icon="🗺️"
            title="Career Maps"
            tag="Explore"
            desc="Visual roadmaps for education and skills."
          />
          <Feature
            icon="📍"
            title="Colleges"
            tag="Find"
            desc="Discover institutions near your location."
          />
        </div>
      </main>
    </div>
  );
}

/* ---------------- FEATURE COMPONENT ---------------- */

function Feature({ title, desc, tag, icon }) {
  return (
    <div style={styles.card}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <span style={styles.tag}>{tag}</span>
      <h3 style={{ marginTop: 12 }}>{title}</h3>
      <p style={{ color: "#64748b" }}>{desc}</p>
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const styles = {
  hero: {
    padding: "100px 20px",
    background: "linear-gradient(135deg, #0d9488, #3b82f6)",
    borderRadius: "0 0 60px 60px",
    color: "white",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: "56px",
    fontWeight: "800",
    maxWidth: "800px",
    lineHeight: "1.1",
  },
  heroSubtitle: {
    fontSize: "20px",
    opacity: 0.9,
    maxWidth: "600px",
    marginTop: "20px",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "8px 16px",
    borderRadius: "100px",
    fontSize: "12px",
    fontWeight: "700",
    marginBottom: "20px",
  },
  whiteBtn: {
    padding: "16px 40px",
    borderRadius: "14px",
    border: "none",
    background: "white",
    color: "#0d9488",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
  },
  outlineBtn: {
    padding: "16px 40px",
    borderRadius: "14px",
    background: "transparent",
    color: "white",
    border: "2px solid rgba(255,255,255,0.7)",
    fontWeight: "700",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    padding: "32px",
    borderRadius: "24px",
    background: "white",
    border: "1px solid #e2e8f0",
  },
  tag: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#0d9488",
    background: "#f0fdfa",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  sectionTitle: {
    textAlign: "center",
    fontSize: "32px",
    marginBottom: "40px",
    fontWeight: "800",
  },
};
