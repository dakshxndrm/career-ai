import React from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

export default function DashboardPrivate() {
  const { userData, currentUser } = useAuth();

  return (
    <div style={styles.container}>
      <Navbar />

      <main style={styles.main}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.greeting}>
            Welcome back, <span style={styles.highlight}>{userData?.name || currentUser?.email?.split('@')[0]}</span> ✨
          </h1>
          <p style={styles.subtitle}>Here is your career overview and next steps.</p>
        </div>

        <div style={styles.grid}>
          {/* Role Status Card */}
          <div style={styles.card}>
            <div style={styles.iconCircle}>💼</div>
            <h3 style={styles.cardTitle}>Current Focus</h3>
            <p style={styles.roleText}>{userData?.role || "Role not set"}</p>
            <div style={styles.badge}>Active Path</div>
          </div>

          {/* Assessment CTA Card */}
          <div style={styles.cardHighlight}>
            <div style={styles.iconCircleLarge}>🧠</div>
            <h3 style={styles.cardTitleWhite}>Career Assessment</h3>
            <p style={styles.cardDescWhite}>
              Complete your AI-driven evaluation to unlock personalized job matches.
            </p>
            <button
              style={styles.ctaButton}
              onClick={() => alert("Assessment starts in Phase 2")}
            >
              Continue Assessment →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)",
    fontFamily: "'Inter', sans-serif",
  },
  main: {
    padding: "60px 72px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  welcomeSection: {
    marginBottom: "40px",
  },
  greeting: {
    fontSize: "36px",
    fontWeight: "800",
    color: "#0f172a",
    margin: 0,
  },
  highlight: {
    color: "#0d9488", // Teal
  },
  subtitle: {
    color: "#64748b",
    fontSize: "18px",
    marginTop: "8px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "white",
    padding: "32px",
    borderRadius: "24px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  cardHighlight: {
    background: "linear-gradient(135deg, #0d9488 0%, #065f46 100%)",
    padding: "32px",
    borderRadius: "24px",
    boxShadow: "0 10px 25px rgba(13, 148, 136, 0.3)",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#f0fdfa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginBottom: "20px",
  },
  iconCircleLarge: {
    width: "56px",
    height: "56px",
    borderRadius: "16px",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#0f172a",
    margin: "0 0 8px 0",
  },
  cardTitleWhite: {
    fontSize: "20px",
    fontWeight: "700",
    color: "white",
    margin: "0 0 8px 0",
  },
  roleText: {
    fontSize: "16px",
    color: "#334155",
    fontWeight: "500",
    marginBottom: "16px",
  },
  cardDescWhite: {
    fontSize: "15px",
    color: "#ccfbf1",
    marginBottom: "24px",
    lineHeight: "1.5",
  },
  badge: {
    padding: "6px 12px",
    borderRadius: "100px",
    backgroundColor: "#ccfbf1",
    color: "#0d9488",
    fontSize: "12px",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  ctaButton: {
    backgroundColor: "white",
    color: "#0d9488",
    border: "none",
    padding: "12px 24px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    transition: "transform 0.2s",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
};