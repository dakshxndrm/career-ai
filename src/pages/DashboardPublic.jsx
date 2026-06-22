import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

/* ── Design tokens ── */
const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  sage: "#2F6B57",
  mist: "#E8E4DA",
  muted: "#6B6B73",
};

/* ── Faint topographic contour lines (signature element) ── */
function TopoLines() {
  return (
    <svg
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "hidden",
      }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1200 520"
    >
      {/* Hill A — left cluster */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse
          key={`a${i}`}
          cx="260"
          cy="300"
          rx={80 + i * 55}
          ry={45 + i * 30}
          fill="none"
          stroke={C.ink}
          strokeWidth="0.8"
          opacity={0.08 - i * 0.01}
          transform="rotate(-12 260 300)"
        />
      ))}
      {/* Hill B — right cluster */}
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={`b${i}`}
          cx="940"
          cy="200"
          rx={70 + i * 50}
          ry={40 + i * 28}
          fill="none"
          stroke={C.ink}
          strokeWidth="0.8"
          opacity={0.07 - i * 0.01}
          transform="rotate(8 940 200)"
        />
      ))}
      {/* Hill C — center-bottom */}
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={`c${i}`}
          cx="600"
          cy="480"
          rx={60 + i * 60}
          ry={30 + i * 20}
          fill="none"
          stroke={C.ink}
          strokeWidth="0.8"
          opacity={0.06 - i * 0.01}
        />
      ))}
    </svg>
  );
}

/* ── Feature card ── */
function FeatureCard({ icon, title, tag, desc, tagColor = C.marigold }) {
  return (
    <div
      style={{
        padding: "32px",
        borderRadius: "16px",
        background: C.paper,
        border: `1px solid ${C.mist}`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 28 }} role="img" aria-label={title}>
        {icon}
      </span>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: tagColor,
          background: `${tagColor}18`,
          padding: "3px 8px",
          borderRadius: 4,
          alignSelf: "flex-start",
        }}
      >
        {tag}
      </span>
      <h3
        style={{
          margin: 0,
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 20,
          fontWeight: 700,
          color: C.ink,
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, color: C.muted, fontSize: 15, lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

/* ── Page ── */
export default function DashboardPublic() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStartQuiz = () => {
    navigate(currentUser ? "/profile" : "/login");
  };

  return (
    <div
      style={{
        background: C.paper,
        minHeight: "100vh",
        fontFamily: "'Inter', system-ui, sans-serif",
        color: C.ink,
      }}
    >
      <Navbar />

      {/* ── HERO ── */}
      <section
        style={{
          position: "relative",
          padding: "96px 24px 80px",
          background: C.ink,
          overflow: "hidden",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TopoLines />

        {/* eyebrow */}
        <span
          style={{
            position: "relative",
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.marigold,
            marginBottom: 24,
          }}
        >
          Career Atlas — Chart Your Course
        </span>

        <h1
          style={{
            position: "relative",
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(36px, 6vw, 64px)",
            fontWeight: 900,
            lineHeight: 1.08,
            color: C.paper,
            maxWidth: 820,
            margin: "0 0 24px",
          }}
        >
          Discover the path that&rsquo;s yours to take.
        </h1>

        <p
          style={{
            position: "relative",
            fontSize: "clamp(16px, 2vw, 20px)",
            color: C.mist,
            maxWidth: 560,
            lineHeight: 1.65,
            margin: "0 0 44px",
          }}
        >
          An AI-powered assessment that maps your strengths, interests, and
          ambitions onto real career routes — then builds your personal
          roadmap.
        </p>

        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Primary: marigold solid */}
          <button
            onClick={handleStartQuiz}
            style={{
              padding: "14px 36px",
              borderRadius: 12,
              border: "none",
              background: C.marigold,
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "opacity .15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
            onFocus={(e) =>
              (e.currentTarget.style.outline = `3px solid ${C.marigold}`)
            }
            onBlur={(e) => (e.currentTarget.style.outline = "none")}
          >
            Start My Assessment
          </button>

          {/* Secondary: ink-outline (visible on dark bg → paper text + mist border) */}
          {currentUser && (
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "14px 36px",
                borderRadius: 12,
                border: `2px solid ${C.mist}`,
                background: "transparent",
                color: C.paper,
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                transition: "border-color .15s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.borderColor = C.marigold)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.borderColor = C.mist)
              }
              onFocus={(e) =>
                (e.currentTarget.style.outline = `3px solid ${C.marigold}`)
              }
              onBlur={(e) => (e.currentTarget.style.outline = "none")}
            >
              My Dashboard &rarr;
            </button>
          )}
        </div>
      </section>

      {/* ── FEATURE STRIP ── */}
      <main
        style={{
          padding: "72px clamp(24px, 8vw, 96px)",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: C.sage,
            marginBottom: 12,
          }}
        >
          What&rsquo;s inside
        </p>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            textAlign: "center",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            color: C.ink,
            marginBottom: 48,
          }}
        >
          Explore your options
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          <FeatureCard
            icon="🧭"
            title="AI Career Assessment"
            tag="Start Now"
            desc="A dynamically generated quiz adapts to your answers and surfaces the careers that fit you — not a generic list."
            tagColor={C.marigold}
          />
          <FeatureCard
            icon="🗺️"
            title="Career Roadmaps"
            tag="Explore"
            desc="Visual field-guides that show exactly what skills, subjects, and steps bridge where you are to where you want to be."
            tagColor={C.sage}
          />
          <FeatureCard
            icon="📍"
            title="Colleges & Institutions"
            tag="Find"
            desc="Discover programs aligned with your matched careers — filtered by location, cost, and entry requirements."
            tagColor={C.muted}
          />
        </div>
      </main>

      {/* ── FOOTER STRIP ── */}
      <footer
        style={{
          borderTop: `1px solid ${C.mist}`,
          padding: "24px clamp(24px, 8vw, 96px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontWeight: 700,
            color: C.ink,
            fontSize: 15,
          }}
        >
          Career Atlas
        </span>
        <span style={{ fontSize: 13, color: C.muted }}>
          AI-powered · Built for students
        </span>
      </footer>
    </div>
  );
}
