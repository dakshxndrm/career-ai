import React from "react";

const C = {
  ink: "#16161D",
  paper: "#FAF8F3",
  marigold: "#E0922F",
  muted: "#6B6B73",
};

export default function RateLimitBanner({ visible, resetMins }) {
  if (!visible) return null;
  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        zIndex: 900,
        background: C.ink,
        color: C.paper,
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 14,
        fontFamily: "'Inter', sans-serif",
        animation: "fadeIn .3s ease",
      }}
    >
      <span aria-hidden="true">⏱</span>
      <span>
        Rate limit reached.{" "}
        {resetMins != null && resetMins > 0
          ? `Try again in ${resetMins} minute${resetMins !== 1 ? "s" : ""}.`
          : "Please wait a moment before retrying."}
      </span>
    </div>
  );
}
