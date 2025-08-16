// frontend/src/components/RunJobsModal.jsx
import { useEffect, useState } from "react";
import { fetchRunJobs, fetchJobLog, aiSuggest } from "../services/gh";

function Badge({ status, conclusion }) {
  const ok = (conclusion || "").toLowerCase() === "success";
  const failed = ["failure", "timed_out", "cancelled"].includes(
    (conclusion || "").toLowerCase()
  );
  const color = ok
    ? "bg-green-100 text-green-700"
    : failed
    ? "bg-red-100 text-red-700"
    : "bg-gray-100 text-gray-700";
  const text = conclusion || status || "—";
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${color}`}>{text}</span>
  );
}

export default function RunJobsModal({ open, onClose, owner, repo, run }) {
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [err, setErr] = useState("");

  // collapsing job sections
  const [openJob, setOpenJob] = useState(null);

  // step log state
  const [openStep, setOpenStep] = useState(null); // key: `${jobId}-${step}`
  const [stepLogs, setStepLogs] = useState({});
  const [stepLoading, setStepLoading] = useState(null);

  // AI assist state
  const [aiForJob, setAiForJob] = useState(null); // jobId
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");

  useEffect(() => {
    if (!open || !owner || !repo || !run) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      setJobs([]);
      setOpenJob(null);
      setAiForJob(null);
      setAiText("");
      try {
        const res = await fetchRunJobs(owner, repo, run);
        if (!mounted) return;
        setJobs(res.jobs || []);
      } catch (e) {
        if (!mounted) return;
        setErr(e.response?.data?.error || e.message || "Failed to load jobs");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, owner, repo, run]);

  if (!open) return null;

  const runId = run?.runId ?? run?.id;

  const handleToggleJob = (jobId) => {
    setOpenJob((cur) => (cur === jobId ? null : jobId));
    // close any open step when switching jobs
    setOpenStep(null);
  };

  const handleToggleStep = async (jobId, stepNum) => {
    const key = `${jobId}-${stepNum}`;
    if (openStep === key) {
      setOpenStep(null);
      return;
    }
    setOpenStep(key);
    if (!stepLogs[key]) {
      try {
        setStepLoading(key);
        const { text } = await fetchJobLog(owner, repo, runId, jobId, stepNum);
        setStepLogs((prev) => ({ ...prev, [key]: text || "" }));
      } catch (e) {
        const msg =
          e.response?.data?.error || e.message || "Failed to load log";
        setStepLogs((prev) => ({ ...prev, [key]: msg }));
      } finally {
        setStepLoading(null);
      }
    }
  };

  const handleAskAI = async (job) => {
    try {
      setAiForJob(job.id);
      setAiLoading(true);
      setAiText("");

      // Gather a compact textual log for this job
      const { text } = await fetchJobLog(owner, repo, runId, job.id);

export async function fetchPipelines(org, includeRuns = true) {
  const { data } = await api.get("/github/pipelines", {
    params: { org, includeRuns },
  });
  return data;
}

/**
 * fetchRunJobs(owner, repo, runOrId)
 * - Accepts a run object (with runId or id), or a primitive id.
 * - Always sends `runId` to backend.
 */
export async function fetchRunJobs(owner, repo, runOrId) {
  const runId =
    typeof runOrId === "object"
      ? runOrId.runId ?? runOrId.id ?? runOrId.run_id
      : runOrId;

  if (runId == null) {
    throw new Error("runId was not provided to fetchRunJobs()");
  }

  // Request step details so that each task's status/conclusion is present in
  // the response. Without `includeSteps` the backend only returned the task
  // names which meant we could not display their current status in the UI.
  const { data } = await api.get("/github/run-jobs", {
    params: { owner, repo, runId: String(runId), includeSteps: true },
  });
  return data;
}

/** Build a compact text log for a job or specific step (for AI or UI) */
export async function fetchJobLog(owner, repo, runId, jobId, stepNum) {
  const params = {
    owner,
    repo,
    runId: String(runId),
    jobId: String(jobId),
  };
  if (stepNum != null) params.step = String(stepNum);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-[900px] max-w-[95vw] shadow-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-medium">
            {owner}/{repo}
            <div className="text-xs text-gray-500">
              {run?.name || ""} &nbsp;•&nbsp;{" "}
              {run?.created_at ? new Date(run.created_at).toLocaleString() : "—"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg border hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="max-h-[75vh] overflow-auto">
          {loading && (
            <div className="px-4 py-6 text-sm text-gray-500">Loading...</div>
          )}
          {!loading && err && (
            <div className="px-4 py-6 text-sm text-red-600">{err}</div>
          )}
          {!loading && !err && jobs.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-500">
              No jobs found for this run.
            </div>
          )}

          {!loading &&
            !err &&
            jobs.map((job) => {
              const failed =
                ["failure", "timed_out", "cancelled"].includes(
                  (job.conclusion || "").toLowerCase()
                ) ||
                (job.steps || []).some(
                  (s) => (s.conclusion || "").toLowerCase() === "failure"
                );

              return (
                <div key={job.id} className="border-b last:border-b-0">
                  <button
                    onClick={() => handleToggleJob(job.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{job.name}</div>
                      <Badge status={job.status} conclusion={job.conclusion} />
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.started_at
                        ? new Date(job.started_at).toLocaleString()
                        : "—"}
                    </div>
                  </button>

                  {openJob === job.id && (
                    <div className="px-4 pb-4 bg-slate-50">
                      <div className="text-xs text-gray-600 mb-2">
                        Steps
                      </div>
                      <div className="rounded-lg border bg-white overflow-hidden">
                        {(job.steps || []).map((s) => {
                          const key = `${job.id}-${s.number}`;
                          const isOpen = openStep === key;
                          return (
                            <div key={s.number} className="border-b last:border-b-0">
                              <button
                                onClick={() => handleToggleStep(job.id, s.number)}
                                className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-50"
                              >
                                <div className="text-sm text-left">{s.name}</div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Badge
                                    status={s.status}
                                    conclusion={s.conclusion}
                                  />
                                  <span>
                                    {s.started_at
                                      ? new Date(s.started_at).toLocaleTimeString()
                                      : "—"}
                                  </span>
                                </div>
                              </button>
                              {isOpen && (
                                <pre className="px-3 py-2 text-xs bg-gray-50 whitespace-pre-wrap overflow-auto">
                                  {stepLoading === key
                                    ? "Loading..."
                                    : stepLogs[key] || ""}
                                </pre>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {failed && (
                        <div className="mt-3">
                          <button
                            onClick={() => handleAskAI(job)}
                            disabled={aiLoading && aiForJob === job.id}
                            className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
                          >
                            {aiLoading && aiForJob === job.id
                              ? "Analyzing with AI..."
                              : "Get AI Fix"}
                          </button>

/** Ask the Gemini backend for a fix suggestion */
export async function aiSuggest({ errorText = "", stepsLog = "" }) {
  const { data } = await api.post("/ai/suggest", { errorText, stepsLog });
  return data; // { suggestion }
}