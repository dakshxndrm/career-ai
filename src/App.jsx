import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";

const Auth            = lazy(() => import("./pages/Auth"));
const DashboardPublic = lazy(() => import("./pages/DashboardPublic"));
const DashboardPrivate= lazy(() => import("./pages/DashboardPrivate"));
const Profile         = lazy(() => import("./pages/Profile"));
const QuizInstructions= lazy(() => import("./pages/QuizInstructions"));
const Assessment      = lazy(() => import("./pages/Assessment"));
const Results         = lazy(() => import("./pages/Results"));
const Roadmap         = lazy(() => import("./pages/Roadmap"));
const Plans           = lazy(() => import("./pages/Plans"));
const Resources       = lazy(() => import("./pages/Resources"));
const PublicProfile   = lazy(() => import("./pages/PublicProfile"));

function RequireId({ children }) {
  const [searchParams] = useSearchParams();
  if (!searchParams.get("id")) return <Navigate to="/profile" replace />;
  return children;
}

// Per-route document titles (SEO). Lighter than react-helmet-async — no dep.
const ROUTE_TITLES = {
  "/": "Career Atlas — AI Career Discovery for Students",
  "/login": "Sign in — Career Atlas",
  "/profile": "Your Profile — Career Atlas",
  "/quiz-instructions": "Start an Assessment — Career Atlas",
  "/assessment": "Your Assessment — Career Atlas",
  "/results": "Your Career Report — Career Atlas",
  "/roadmap": "Your Roadmap — Career Atlas",
  "/dashboard": "Dashboard — Career Atlas",
  "/plans": "My Plans — Career Atlas",
  "/resources": "Resources — Career Atlas",
};

function RouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const title =
      ROUTE_TITLES[pathname] ||
      (pathname.startsWith("/u/") ? "Profile — Career Atlas" : "Career Atlas");
    document.title = title;
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E8E4DA", borderTopColor: "#E0922F", animation: "spin 1s linear infinite" }} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary fullScreen>
      <BrowserRouter>
        <AuthProvider>
          <RouteTitle />
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* PUBLIC */}
              <Route path="/"       element={<DashboardPublic />} />
              <Route path="/login"  element={<Auth />} />
              <Route path="/u/:uid" element={<PublicProfile />} />

              {/* PROTECTED */}
              <Route path="/profile"          element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/quiz-instructions" element={<ProtectedRoute><QuizInstructions /></ProtectedRoute>} />

              {/* AI-heavy pages get their own boundary so a failure here
                  shows a recoverable card instead of taking down the app. */}
              <Route path="/assessment" element={
                <ProtectedRoute><RequireId>
                  <ErrorBoundary
                    title="The assessment hit a snag"
                    message="Something went wrong while building or running your quiz. Try again, or reload if it persists."
                  >
                    <Assessment />
                  </ErrorBoundary>
                </RequireId></ProtectedRoute>
              } />
              <Route path="/results" element={
                <ProtectedRoute><RequireId>
                  <ErrorBoundary
                    title="Couldn't render your report"
                    message="Something went wrong while preparing your results. Try again, or reload if it persists."
                  >
                    <Results />
                  </ErrorBoundary>
                </RequireId></ProtectedRoute>
              } />
              <Route path="/roadmap" element={
                <ProtectedRoute><RequireId><Roadmap /></RequireId></ProtectedRoute>
              } />

              <Route path="/dashboard" element={<ProtectedRoute><DashboardPrivate /></ProtectedRoute>} />
              <Route path="/plans"     element={<ProtectedRoute><Plans /></ProtectedRoute>} />
              <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
            </Routes>
          </Suspense>
          <Analytics />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
