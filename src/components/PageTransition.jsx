import React from "react";

export default function PageTransition({ children, style }) {
  return (
    <div className="page-enter" style={style}>
      {children}
    </div>
  );
}
