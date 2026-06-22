import React from "react";
import Results from "./pages/Results";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import DashboardPublic from "./pages/DashboardPublic";
import DashboardPrivate from "./pages/DashboardPrivate";
import Profile from "./pages/Profile";
import QuizInstructions from "./pages/QuizInstructions";
import Assessment from "./pages/Assessment";
import Roadmap from "./pages/Roadmap";
import Resume from "./pages/Resume";
import PublicProfile from "./pages/PublicProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC */}
          <Route path="/" element={<DashboardPublic />} />
          <Route path="/login" element={<Auth />} />

          {/* PROTECTED FLOW */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/quiz-instructions"
            element={
              <ProtectedRoute>
                <QuizInstructions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/assessment"
            element={
              <ProtectedRoute>
                <Assessment />
              </ProtectedRoute>
            }
          />

          <Route
  path="/results"
  element={
    <ProtectedRoute>
      <Results />
    </ProtectedRoute>
  }
/>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPrivate />
              </ProtectedRoute>
            }
          />

          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <Roadmap />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <Resume />
              </ProtectedRoute>
            }
          />

          {/* Public route — no auth required */}
          <Route path="/u/:uid" element={<PublicProfile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
