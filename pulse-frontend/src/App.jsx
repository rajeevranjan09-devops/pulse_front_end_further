import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  const stored = localStorage.getItem("token");
  const isAuth = stored && stored !== "undefined" && stored !== "null";

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />}
      />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuth ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}
