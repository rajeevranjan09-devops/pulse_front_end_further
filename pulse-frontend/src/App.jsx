import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import { getMe } from "./services/me";

function Shell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const u = await getMe();
        setUser(u);
        if (!u.githubConfigured) navigate("/setup", { replace: true });
        else navigate("/dashboard", { replace: true });
      } catch {
        navigate("/login", { replace: true });
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return null;
  return null; // navigation handled above
}

export default function App() {
  const token = localStorage.getItem("token"); // adjust if you store auth differently

  return (
    <Routes>
      {/* Root: redirect based on auth */}
      <Route
        path="/"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Catch-all */}
      <Route
        path="*"
        element={<Navigate to={token ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}

function Guard({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { try {
      const u = await getMe(); setUser(u);
    } finally { setReady(true); } })(); }, []);
  if (!ready) return null;
  // pass user via wrapper components:
  return children;
}

function DashboardWrapper() {
  const [u, setU] = useState(null);
  useEffect(() => { getMe().then(setU); }, []);
  return u ? <Dashboard user={u} /> : null;
}

function SetupWrapper({ appBaseUrl }) {
  const [u, setU] = useState(null);
  const nav = useNavigate();
  useEffect(() => { getMe().then(setU); }, []);
  if (!u) return null;
  return <Setup user={u} appBaseUrl={appBaseUrl} onDone={() => nav("/dashboard")} />;
}