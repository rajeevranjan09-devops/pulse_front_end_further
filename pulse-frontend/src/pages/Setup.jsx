import { useState } from "react";
import { saveGitConfig } from "../services/me";
import Topbar from "../components/Topbar";

export default function Setup({ user, onDone, appBaseUrl }) {
  const [pat, setPat] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const callbackUrl = `${appBaseUrl}/auth/github/callback`;
  const homepageUrl = appBaseUrl;

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const onSave = async () => {
    try {
      setSaving(true); setErr("");
      await saveGitConfig({ pat, clientId, clientSecret, callbackUrl, homepageUrl });
      onDone();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar user={user} onLogout={() => { localStorage.clear(); location.href="/login"; }} />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-xl font-semibold mb-4">Connect GitHub</h1>

        {err && <div className="mb-4 text-sm text-red-600">{err}</div>}

        <div className="space-y-6">
          <section className="p-4 rounded-2xl border bg-white">
            <h2 className="font-medium mb-3">Step 1 — Personal Access Token</h2>
            <p className="text-sm text-gray-600 mb-3">
              Create a Fine-grained token with minimum scopes: <code>repo</code>, <code>read:org</code>, <code>workflow</code>.
            </p>
            <input
              className="w-full border rounded-lg px-3 py-2"
              placeholder="ghp_xxx..."
              value={pat}
              onChange={(e) => setPat(e.target.value)}
            />
          </section>

          <section className="p-4 rounded-2xl border bg-white">
            <h2 className="font-medium mb-3">Step 2 — GitHub OAuth App (optional for now)</h2>
            <div className="grid md:grid-cols-2 gap-3">
              <input className="border rounded-lg px-3 py-2" placeholder="Client ID"
                     value={clientId} onChange={(e)=>setClientId(e.target.value)} />
              <input className="border rounded-lg px-3 py-2" placeholder="Client Secret"
                     value={clientSecret} onChange={(e)=>setClientSecret(e.target.value)} />
              <div className="md:col-span-2 text-sm">
                <div className="mt-2">Homepage URL: <code>{homepageUrl}</code></div>
                <div>Authorization callback URL: <code>{callbackUrl}</code></div>
              </div>
            </div>
          </section>

          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}