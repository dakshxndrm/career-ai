import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav style={styles.navbar}>
      {/* LEFT: Logo */}
      <div style={styles.logo} onClick={() => navigate("/")}>
        <span style={styles.logoIcon}>🚀</span>
        <strong style={styles.logoText}>Career AI</strong>
      </div>

      {/* CENTER: Navigation Pod */}
      <div style={styles.linkContainer}>
        <NavLink to="/" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}>
          Home
        </NavLink>
        {currentUser && (
          <NavLink to="/dashboard" style={({ isActive }) => ({ ...styles.link, ...(isActive ? styles.activeLink : {}) })}>
            My Dashboard
          </NavLink>
        )}
      </div>

      {/* RIGHT: Actions */}
      <div style={styles.actionContainer}>
        {currentUser ? (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button style={styles.iconButton} title="Notifications">
                🔔<span style={styles.notificationDot}></span>
              </button>
              
              {/* ACCOUNT DROPDOWN TRIGGER */}
              <button 
                style={styles.profileBtn} 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div style={styles.avatar}>👤</div>
                <span style={styles.profileText}>Account</span>
                <span style={{ fontSize: "10px", marginLeft: "4px" }}>{showDropdown ? "▲" : "▼"}</span>
              </button>
            </div>

            {/* DROPDOWN MENU */}
            {showDropdown && (
              <div style={styles.dropdown}>
                <button style={styles.dropdownItem} onClick={() => { navigate("/profile"); setShowDropdown(false); }}>
                  👤 View Profile
                </button>
                <button style={styles.dropdownItem} onClick={() => alert("Theme switching coming soon!")}>
                  🌓 Switch Theme
                </button>
                <div style={styles.divider}></div>
                <button style={{ ...styles.dropdownItem, color: "#ef4444" }} onClick={handleLogout}>
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={styles.authGroup}>
            <button onClick={() => navigate("/login")} style={styles.loginBtn}>Log In</button>
            <button onClick={() => navigate("/signup")} style={styles.signupBtn}>Sign Up</button>
          </div>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: { height: "80px", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(13, 148, 136, 0.1)", position: "sticky", top: 0, zIndex: 1000 },
  logo: { display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" },
  logoText: { fontSize: "20px", fontWeight: "800", background: "linear-gradient(90deg, #0d9488, #3b82f6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  linkContainer: { display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "100px" },
  link: { textDecoration: "none", color: "#64748b", padding: "8px 20px", borderRadius: "100px", fontSize: "14px", fontWeight: "600" },
  activeLink: { backgroundColor: "white", color: "#0d9488", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  actionContainer: { display: "flex", alignItems: "center", gap: "12px" },
  authGroup: { display: "flex", gap: "12px" },
  loginBtn: { background: "none", border: "none", color: "#0d9488", fontWeight: "600", cursor: "pointer" },
  signupBtn: { backgroundColor: "#0d9488", color: "white", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: "600", cursor: "pointer" },
  iconButton: { background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", width: "40px", height: "40px", cursor: "pointer", position: "relative" },
  notificationDot: { position: "absolute", top: "8px", right: "8px", width: "8px", height: "8px", backgroundColor: "#ef4444", borderRadius: "50%", border: "2px solid white" },
  profileBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "100px", cursor: "pointer" },
  avatar: { width: "28px", height: "28px", backgroundColor: "#ccfbf1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" },
  profileText: { fontSize: "14px", fontWeight: "600", color: "#1e293b" },
  
  /* DROPDOWN STYLES */
  dropdown: {
    position: "absolute",
    top: "120%",
    right: 0,
    width: "200px",
    backgroundColor: "white",
    borderRadius: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    border: "1px solid #e2e8f0",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    animation: "fadeIn 0.2s ease-out"
  },
  dropdownItem: {
    padding: "10px 16px",
    border: "none",
    background: "none",
    borderRadius: "8px",
    textAlign: "left",
    fontSize: "14px",
    fontWeight: "500",
    color: "#475569",
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  divider: { height: "1px", backgroundColor: "#e2e8f0", margin: "4px 8px" }
};