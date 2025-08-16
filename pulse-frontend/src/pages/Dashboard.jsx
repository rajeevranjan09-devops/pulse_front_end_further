// frontend/src/pages/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/Topbar";
import { fetchPipelines } from "../services/gh";
import StatusBadge from "../components/StatusBadge";
import RunJobsModal from "../components/RunJobsModal";
import { useAuth } from "../context/AuthContext";

function Tile({ title, value }) {
  return (
    <div className="p-4 rounded-2xl border bg-white">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}

const REFRESH_MS = 5000;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [org, setOrg] = useState(localStorage.getItem("selected_org") || "");
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOwner, setModalOwner] = useState("");
  const [modalRepo, setModalRepo] = useState("");
  const [modalRun, setModalRun] = useState(null);

  const load = async (selectedOrg = org) => {
    if (!selectedOrg) return;
    setLoading(true);
    setErr("");
    try {
      const data = await fetchPipelines(selectedOrg, true);
      setPipelines(data);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed to load data");
      setPipelines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (org) load(org);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  useEffect(() => {
    if (!org) return;
    const id = setInterval(() => load(org), REFRESH_MS);

    const onVisible = () => !document.hidden && load(org);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const stats = useMemo(() => {
    const total = pipelines.length;
    let success = 0,
      failed = 0,
      running = 0;
    for (const p of pipelines) {
      const s = p.latest_run?.status;
      const c = p.latest_run?.conclusion;
      if (c === "success") success++;
      else if (c === "failure" || c === "cancelled" || c === "timed_out")
        failed++;
      else if (s === "in_progress" || s === "queued") running++;
    }
    return { total, success, failed, running };
  }, [pipelines]);

  const openModal = (p) => {
    if (!p.latest_run) return;
    setModalOwner(p.owner);
    setModalRepo(p.repo);
    setModalRun(p.latest_run); // pass entire run object
    setModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Topbar
        user={user}
        onLogout={handleLogout}
        org={org}
        setOrg={setOrg}
        onReload={() => load(org)}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <button
            onClick={() => load(org)}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Tile title="Total workflows" value={stats.total} />
          <Tile title="Succeeded" value={stats.success} />
          <Tile title="Failed/Cancelled" value={stats.failed} />
          <Tile title="Running/Queued" value={stats.running} />
        </div>

        <div className="rounded-2xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-slate-50 text-sm text-gray-600">
            {loading
              ? "Loading pipelines..."
              : err
              ? err
              : `${pipelines.length} workflows`}
          </div>

          <div className="divide-y">
            {pipelines.map((p) => (
              <button
                key={`${p.owner}/${p.repo}/${p.workflowId}`}
                onClick={() => openModal(p)}
                className="w-full text-left px-4 py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 hover:bg-slate-50 focus:bg-slate-50"
              >
                <div className="min-w-[220px]">
                  <div className="font-medium">
                    {p.owner}/{p.repo}
                  </div>
                  <span className="text-sm text-blue-600 hover:underline">
                    {p.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <StatusBadge
                    status={p.latest_run?.status}
                    conclusion={p.latest_run?.conclusion}
                  />
                  {p.latest_run?.head_branch && (
                    <span className="text-xs text-gray-500">
                      branch: {p.latest_run.head_branch}
                    </span>
                  )}
                </div>

                <div className="md:ml-auto text-sm text-gray-500">
                  {p.latest_run?.created_at
                    ? new Date(p.latest_run.created_at).toLocaleString()
                    : "—"}
                </div>
              </button>
            ))}

            {!loading && pipelines.length === 0 && !err && (
              <div className="px-4 py-8 text-sm text-gray-500">
                No workflows found for this org. Make sure it has a
                `.github/workflows/*.yml` file or set a PAT for private repos.
              </div>
            )}
          </div>
        </div>
      </div>

      <RunJobsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        owner={modalOwner}
        repo={modalRepo}
        run={modalRun}
      />
    </div>
  );
}