import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import DashboardPublic from "./pages/DashboardPublic";
import DashboardPrivate from "./pages/DashboardPrivate";
import Profile from "./pages/Profile";
import QuizInstructions from "./pages/QuizInstructions";
import Assessment from "./pages/Assessment";
import ReviewAssessment from "./pages/ReviewAssessment";
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
            path="/assessment/review"
            element={
              <ProtectedRoute>
                <ReviewAssessment />
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
