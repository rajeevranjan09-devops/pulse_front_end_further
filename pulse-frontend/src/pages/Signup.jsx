import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "", lastName: "", designation: "",
    username: "", password: ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);
    try {
      await api.post("/auth/signup", form);
      setMsg("Signup successful. Please login.");
      setTimeout(() => navigate("/login"), 800);
    } catch (e) {
      setErr(e.response?.data?.error || "Signup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-semibold mb-6">Create account</h1>
        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}
        {msg && <div className="mb-4 text-sm text-green-600">{msg}</div>}
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">First name</label>
            <input name="firstName" value={form.firstName} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Last name</label>
            <input name="lastName" value={form.lastName} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm mb-1">Designation</label>
            <input name="designation" value={form.designation} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input name="username" value={form.username} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" name="password" value={form.password} onChange={onChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-lg py-2.5 hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Sign up"}
            </button>
          </div>
        </form>
        <p className="text-sm mt-4">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}