import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

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

  const linkBase = {
    textDecoration: "none",
    color: C.muted,
    padding: "7px 18px",
    borderRadius: 100,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Inter', sans-serif",
    transition: "color .15s",
  };

  const linkActive = {
    backgroundColor: C.paper,
    color: C.ink,
    boxShadow: "0 1px 4px rgba(22,22,29,0.08)",
  };

  return (
    <nav
      style={{
        height: 68,
        padding: "0 clamp(20px, 5vw, 48px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: C.paper,
        borderBottom: `1px solid ${C.mist}`,
        position: "sticky",
        top: 0,
        zIndex: 1000,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* LEFT: Wordmark */}
      <button
        onClick={() => navigate("/")}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        aria-label="Career Atlas home"
      >
        {/* Atlas compass mark */}
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="10" stroke={C.marigold} strokeWidth="1.5" />
          <circle cx="11" cy="11" r="6" stroke={C.ink} strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="11" cy="11" r="2" fill={C.marigold} />
          <line x1="11" y1="1" x2="11" y2="5" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="11" y1="17" x2="11" y2="21" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="1" y1="11" x2="5" y2="11" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="11" x2="21" y2="11" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 18,
            fontWeight: 800,
            color: C.ink,
            letterSpacing: "-0.01em",
          }}
        >
          Career Atlas
        </span>
      </button>

      {/* CENTER: Nav pill */}
      <div
        style={{
          display: "flex",
          gap: 2,
          backgroundColor: C.mist,
          padding: 3,
          borderRadius: 100,
        }}
      >
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({ ...linkBase, ...(isActive ? linkActive : {}) })}
        >
          Home
        </NavLink>
        {currentUser && (
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({ ...linkBase, ...(isActive ? linkActive : {}) })}
          >
            Dashboard
          </NavLink>
        )}
      </div>

      {/* RIGHT: Auth actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {currentUser ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowDropdown((s) => !s)}
              aria-expanded={showDropdown}
              aria-haspopup="true"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px 6px 8px",
                backgroundColor: C.paper,
                border: `1px solid ${C.mist}`,
                borderRadius: 100,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {/* Avatar */}
              <span
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  backgroundColor: `${C.marigold}22`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.marigold,
                  flexShrink: 0,
                }}
              >
                {(currentUser.email?.[0] ?? "U").toUpperCase()}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                Account
              </span>
              <span style={{ fontSize: 9, color: C.muted }}>{showDropdown ? "▲" : "▼"}</span>
            </button>

            {showDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 188,
                  backgroundColor: C.paper,
                  border: `1px solid ${C.mist}`,
                  borderRadius: 14,
                  boxShadow: "0 8px 24px rgba(22,22,29,0.10)",
                  padding: "6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <DropItem
                  label="View Profile"
                  onClick={() => { navigate("/profile"); setShowDropdown(false); }}
                />
                <div style={{ height: 1, backgroundColor: C.mist, margin: "4px 8px" }} />
                <DropItem
                  label="Log out"
                  onClick={handleLogout}
                  danger
                />
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "none",
                border: `1.5px solid ${C.ink}`,
                color: C.ink,
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                padding: "8px 18px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/signup")}
              style={{
                background: C.marigold,
                border: "none",
                color: "#fff",
                fontFamily: "'Inter', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                padding: "8px 18px",
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              Sign up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function DropItem({ label, onClick, danger }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "9px 14px",
        border: "none",
        background: hovered ? C.mist : "transparent",
        borderRadius: 8,
        textAlign: "left",
        fontSize: 14,
        fontWeight: 500,
        color: danger ? "#c0392b" : C.ink,
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif",
        transition: "background .12s",
      }}
    >
      {label}
    </button>
  );
}

