import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import Auth from "./pages/Auth";
import DashboardPublic from "./pages/DashboardPublic";
import DashboardPrivate from "./pages/DashboardPrivate";
import Profile from "./pages/Profile";
import QuizInstructions from "./pages/QuizInstructions";
import Assessment from "./pages/Assessment";
import Results from "./pages/Results";
import Roadmap from "./pages/Roadmap";
import PublicProfile from "./pages/PublicProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Guard: redirect to /profile if ?id= is missing
function RequireId({ children }) {
  const [searchParams] = useSearchParams();
  if (!searchParams.get("id")) return <Navigate to="/profile" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<DashboardPublic />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/u/:uid" element={<PublicProfile />} />

          {/* PROTECTED */}
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/quiz-instructions" element={<ProtectedRoute><QuizInstructions /></ProtectedRoute>} />

          <Route path="/assessment" element={
            <ProtectedRoute>
              <RequireId><Assessment /></RequireId>
            </ProtectedRoute>
          } />

          <Route path="/results" element={
            <ProtectedRoute>
              <RequireId><Results /></RequireId>
            </ProtectedRoute>
          } />

          <Route path="/roadmap" element={
            <ProtectedRoute>
              <RequireId><Roadmap /></RequireId>
            </ProtectedRoute>
          } />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPrivate /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
