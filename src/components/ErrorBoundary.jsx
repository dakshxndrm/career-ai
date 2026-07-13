import React from "react";
import { C, font } from "../theme";

/**
 * Catches render/runtime errors in its subtree and shows an in-identity
 * fallback instead of a white screen.
 *
 * Props:
 *   fullScreen  – cover the viewport (top-level). Default: false (inline card).
 *   title       – fallback heading. Default: "Something went off the map".
 *   message     – fallback body copy.
 *   onReset     – optional; when provided, shows a "Try again" button that
 *                 clears the error state and re-renders children. Useful for
 *                 per-route boundaries where a reload would lose context.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const {
      fullScreen = false,
      title = "Something went off the map",
      message = "An unexpected error stopped this page from loading. Reloading usually sets things right.",
      onReset,
    } = this.props;

    const Compass = (
      <svg width="44" height="44" viewBox="0 0 22 22" fill="none" aria-hidden="true" style={{ marginBottom: 20 }}>
        <circle cx="11" cy="11" r="10" stroke={C.marigold} strokeWidth="1.5" />
        <circle cx="11" cy="11" r="6" stroke={C.ink} strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="11" cy="11" r="2" fill={C.marigold} />
        <line x1="11" y1="1" x2="11" y2="5" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="11" y1="17" x2="11" y2="21" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="1" y1="11" x2="5" y2="11" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
        <line x1="17" y1="11" x2="21" y2="11" stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );

    const card = (
      <div
        role="alert"
        style={{
          textAlign: "center",
          background: "#fff",
          border: `1px solid ${C.mist}`,
          borderRadius: 20,
          padding: "clamp(32px, 6vw, 48px)",
          maxWidth: 440,
          width: "100%",
          margin: "0 auto",
        }}
      >
        {Compass}
        <h1 style={{ fontFamily: font.display, fontSize: 24, fontWeight: 900, color: C.ink, margin: "0 0 10px", lineHeight: 1.15 }}>
          {title}
        </h1>
        <p style={{ fontFamily: font.body, fontSize: 15, color: C.muted, lineHeight: 1.65, margin: "0 0 26px" }}>
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {onReset && (
            <button
              onClick={this.handleReset}
              style={btn(C.marigold, "#fff", "none")}
            >
              Try again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            style={onReset ? btn("transparent", C.ink, `1.5px solid ${C.ink}`) : btn(C.marigold, "#fff", "none")}
          >
            Reload page
          </button>
        </div>
      </div>
    );

    if (fullScreen) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: C.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {card}
        </div>
      );
    }

    return <div style={{ padding: "48px 24px", display: "flex", justifyContent: "center" }}>{card}</div>;
  }
}

function btn(bg, color, border) {
  return {
    padding: "12px 28px",
    borderRadius: 12,
    border,
    background: bg,
    color,
    fontFamily: font.body,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  };
}
