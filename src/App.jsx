import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
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

function PageFallback() {
  return (
    <div style={{ minHeight: "100vh", background: "#FAF8F3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid #E8E4DA", borderTopColor: "#E0922F", animation: "spin 1s linear infinite" }} />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* PUBLIC */}
            <Route path="/"       element={<DashboardPublic />} />
            <Route path="/login"  element={<Auth />} />
            <Route path="/u/:uid" element={<PublicProfile />} />

            {/* PROTECTED */}
            <Route path="/profile"          element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/quiz-instructions" element={<ProtectedRoute><QuizInstructions /></ProtectedRoute>} />

            <Route path="/assessment" element={
              <ProtectedRoute><RequireId><Assessment /></RequireId></ProtectedRoute>
            } />
            <Route path="/results" element={
              <ProtectedRoute><RequireId><Results /></RequireId></ProtectedRoute>
            } />
            <Route path="/roadmap" element={
              <ProtectedRoute><RequireId><Roadmap /></RequireId></ProtectedRoute>
            } />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPrivate /></ProtectedRoute>} />
            <Route path="/plans"     element={<ProtectedRoute><Plans /></ProtectedRoute>} />
            <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
