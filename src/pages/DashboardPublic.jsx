import React from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import PageTransition from "../components/PageTransition";
import { C, font } from "../theme";

// Respect prefers-reduced-motion for hover lifts
const motionQuery =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };

const liftStyle = motionQuery.matches
  ? {}
  : {
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    };

function useCardHover() {
  const [hovered, setHovered] = React.useState(false);
  const reduced = motionQuery.matches;
  return {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    style: hovered && !reduced
      ? { transform: "translateY(-4px)", boxShadow: "0 8px 28px rgba(22,22,29,0.10)" }
      : {},
  };
}

/* ── Topographic contour lines (hero bg) ── */
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
      viewBox="0 0 1200 600"
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse
          key={`a${i}`}
          cx="220"
          cy="360"
          rx={90 + i * 60}
          ry={50 + i * 34}
          fill="none"
          stroke={C.paper}
          strokeWidth="0.8"
          opacity={0.07 - i * 0.01}
          transform="rotate(-14 220 360)"
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <ellipse
          key={`b${i}`}
          cx="980"
          cy="180"
          rx={80 + i * 55}
          ry={44 + i * 30}
          fill="none"
          stroke={C.paper}
          strokeWidth="0.8"
          opacity={0.06 - i * 0.01}
          transform="rotate(10 980 180)"
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <ellipse
          key={`c${i}`}
          cx="600"
          cy="560"
          rx={70 + i * 65}
          ry={35 + i * 22}
          fill="none"
          stroke={C.paper}
          strokeWidth="0.8"
          opacity={0.05 - i * 0.01}
        />
      ))}
    </svg>
  );
}

/* ── Step card (How it works) ── */
function StepCard({ number, title, caption }) {
  const hover = useCardHover();
  return (
    <div
      onMouseEnter={hover.onMouseEnter}
      onMouseLeave={hover.onMouseLeave}
      style={{
        flex: "1 1 220px",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 12,
        padding: "28px 24px",
        borderRadius: 16,
        background: "#fff",
        border: `1px solid ${C.mist}`,
        ...liftStyle,
        ...hover.style,
      }}
    >
      <span
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 40,
          fontWeight: 900,
          color: C.marigold,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        {number}
      </span>
      <h3
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 18,
          fontWeight: 800,
          color: C.ink,
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.65 }}>
        {caption}
      </p>
    </div>
  );
}

/* ── Page ── */
export default function DashboardPublic() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleStartQuiz = () => {
    navigate(currentUser ? "/quiz-instructions" : "/login");
  };

  return (
    <PageTransition>
    <div
      style={{
        background: C.paper,
        minHeight: "100vh",
        fontFamily: font.body,
        color: C.ink,
      }}
    >
      <Navbar />

      {/* ── 1. HERO ── */}
      <section
        style={{
          position: "relative",
          padding: "clamp(72px, 12vw, 120px) clamp(20px, 6vw, 72px) clamp(72px, 10vw, 100px)",
          background: C.ink,
          overflow: "hidden",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <TopoLines />

        <span
          style={{
            position: "relative",
            display: "inline-block",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: C.marigold,
            marginBottom: 22,
          }}
        >
          Career Atlas — Chart Your Course
        </span>

        <h1
          style={{
            position: "relative",
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: "clamp(40px, 7vw, 72px)",
            fontWeight: 900,
            lineHeight: 1.06,
            color: C.paper,
            maxWidth: 860,
            margin: "0 0 26px",
            letterSpacing: "-0.01em",
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
            lineHeight: 1.7,
            margin: "0 0 40px",
          }}
        >
          An AI-powered assessment that maps your strengths, interests, and
          ambitions onto real career routes — then builds your personal roadmap.
        </p>

        {/* CTAs */}
        <div
          style={{
            position: "relative",
            display: "flex",
            gap: 14,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <button
            onClick={handleStartQuiz}
            style={{
              padding: "15px 38px",
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

          {currentUser && (
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "15px 38px",
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

        {/* Trust line */}
        <p
          style={{
            position: "relative",
            fontSize: 12,
            color: `${C.mist}99`,
            letterSpacing: "0.04em",
            margin: 0,
          }}
        >
          Free &middot; No card needed &middot; Built for students
        </p>
      </section>

      {/* ── 2. SOCIAL PROOF STRIP ── */}
      <div
        style={{
          background: C.paper,
          borderBottom: `1px solid ${C.mist}`,
          padding: "18px clamp(20px, 6vw, 72px)",
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        {[
          "20+ adaptive questions",
          "AI-matched careers",
          "Personal roadmap",
          "Progress tracking",
        ].map((label) => (
          <span
            key={label}
            style={{
              padding: "7px 18px",
              borderRadius: 999,
              border: `1px solid ${C.mist}`,
              background: C.paper,
              fontSize: 13,
              fontWeight: 600,
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
        ))}
      </div>

      <main>
        {/* ── 3. HOW IT WORKS ── */}
        <section
          style={{
            padding: "80px clamp(20px, 6vw, 72px) 72px",
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <p style={eyebrow}>How it works</p>
          <h2 style={sectionH2}>Three steps to clarity.</h2>

          <div
            className="stagger"
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 40,
            }}
          >
            <StepCard
              number="01"
              title="Take the quiz"
              caption="Answer 20+ adaptive questions about your interests, skills, and goals. The AI tailors each question to your profile."
            />
            <StepCard
              number="02"
              title="Get your AI career report"
              caption="Receive a personalised report showing your top career matches, strengths, and a summary of your personality type."
            />
            <StepCard
              number="03"
              title="Follow your roadmap"
              caption="Unlock a phase-by-phase learning plan with skills to tick off, courses to take, and a streak to keep you moving."
            />
          </div>
        </section>

        {/* ── 4. FINAL CTA BAND ── */}
        <section
          style={{
            position: "relative",
            background: C.ink,
            overflow: "hidden",
            padding: "80px clamp(20px, 6vw, 72px)",
            textAlign: "center",
          }}
        >
          {/* Faint topo echo */}
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
            viewBox="0 0 800 240"
            preserveAspectRatio="xMidYMid slice"
          >
            {[0, 1, 2, 3].map((i) => (
              <ellipse
                key={i}
                cx="400"
                cy="220"
                rx={80 + i * 80}
                ry={36 + i * 22}
                fill="none"
                stroke={C.paper}
                strokeWidth="0.7"
                opacity={0.06 - i * 0.01}
              />
            ))}
          </svg>

          <p
            style={{
              position: "relative",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: C.marigold,
              marginBottom: 18,
            }}
          >
            Get started today
          </p>
          <h2
            style={{
              position: "relative",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 900,
              color: C.paper,
              margin: "0 0 36px",
              lineHeight: 1.1,
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Ready to chart your course?
          </h2>
          <button
            onClick={handleStartQuiz}
            style={{
              position: "relative",
              padding: "16px 44px",
              borderRadius: 12,
              border: "none",
              background: C.marigold,
              color: "#fff",
              fontFamily: "'Inter', sans-serif",
              fontSize: 16,
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
        </section>
      </main>

      {/* ── 6. FOOTER ── */}
      <footer
        style={{
          borderTop: `1px solid ${C.mist}`,
          padding: "32px clamp(20px, 6vw, 72px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          background: C.paper,
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
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
              fontWeight: 800,
              color: C.ink,
              fontSize: 15,
            }}
          >
            Career Atlas
          </span>
        </div>

        {/* Nav links */}
        <nav aria-label="Footer navigation" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            { label: "Home",      to: "/" },
            { label: "Dashboard", to: "/dashboard" },
            { label: "My Plans",  to: "/plans" },
          ].map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? C.ink : C.muted,
                textDecoration: "none",
                transition: "color .15s",
              })}
              onMouseOver={(e) => (e.currentTarget.style.color = C.ink)}
              onMouseOut={(e) => (e.currentTarget.style.color = C.muted)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Tagline */}
        <span style={{ fontSize: 12, color: C.muted, letterSpacing: "0.02em" }}>
          AI-powered &middot; Built for students
        </span>
      </footer>
    </div>
    </PageTransition>
  );
}

/* ── Shared text styles ── */
const eyebrow = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: C.sage,
  margin: "0 0 10px",
};

const sectionH2 = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: "clamp(24px, 4vw, 36px)",
  fontWeight: 800,
  color: C.ink,
  margin: 0,
  lineHeight: 1.15,
};
