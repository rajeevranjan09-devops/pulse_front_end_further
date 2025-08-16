import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  // Get context safely (in case provider isn’t mounted, component will render nothing)
  const auth = useAuth();
  if (!auth) return null;

  // ⬇ rename to avoid any collision with an existing "login" identifier
  const { login: authLogin } = auth;

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await authLogin(form.username, form.password); // call context login
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm p-6">
        <h1 className="text-2xl font-semibold mb-6">Login</h1>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black text-white py-2 hover:opacity-90"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          No account? <Link to="/signup" className="text-blue-600">Sign up</Link>
        </div>
      </div>
    </div>
  );
}