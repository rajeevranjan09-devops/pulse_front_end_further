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
  const [openStep, setOpenStep] = useState(null); // { jobId, step }
  const [logCache, setLogCache] = useState({}); // { "jobId-step": text }
  const [loadingStep, setLoadingStep] = useState(null); // key currently fetching

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
      setOpenStep(null);
      setLogCache({});
      setLoadingStep(null);
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
    setOpenStep(null);
    setOpenJob((cur) => (cur === jobId ? null : jobId));
  };

  const handleToggleStep = async (jobId, stepNum) => {
    const key = `${jobId}-${stepNum}`;
    const isOpen =
      openStep && openStep.jobId === jobId && openStep.step === stepNum;
    const next = isOpen ? null : { jobId, step: stepNum };
    setOpenStep(next);

    if (!isOpen && !logCache[key]) {
      setLoadingStep(key);
      try {
        const { text } = await fetchJobLog(
          owner,
          repo,
          runId,
          jobId,
          stepNum
        );
        // Populate cache with the real log text. If the backend returns an
        // empty payload we show a friendly fallback message.
        setLogCache((cur) => ({
          ...cur,
          [key]: text && text.trim() ? text : "No log available",
        }));
      } catch (e) {
        const msg =
          e.response?.status === 404
            ? "No log available"
            : e.response?.data?.error || e.message || "Failed to load log";
        setLogCache((cur) => ({
          ...cur,
          [key]: msg,
        }));
      } finally {
        setLoadingStep(null);
      }
    }
  };

  const handleAskAI = async (job) => {
    try {
      setAiForJob(job.id);
      setAiLoading(true);
      setAiText("");

      // Identify a failed step (if any)
      const failedStep = (job.steps || []).find(
        (s) => (s.conclusion || "").toLowerCase() === "failure"
      );

      // Gather a compact textual log for this job or a specific failed step
      const { text } = await fetchJobLog(
        owner,
        repo,
        runId,
        job.id,
        failedStep?.number
      );

      // Build a short error text from failed steps (if any)
      const errorText = failedStep
        ? `Failed step: ${failedStep.name} — status: ${failedStep.status}, conclusion: ${failedStep.conclusion}`
        : `Job ended with conclusion: ${job.conclusion}`;

      const { suggestion } = await aiSuggest({
        errorText,
        stepsLog: text || "",
      });

      setAiText(suggestion || "No suggestion");
    } catch (e) {
      setAiText(e.response?.data?.error || e.message || "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  };

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
                          const isOpen =
                            openStep &&
                            openStep.jobId === job.id &&
                            openStep.step === s.number;
                          return (
                            <div key={s.number} className="border-b last:border-b-0">
                              <button
                                onClick={() => handleToggleStep(job.id, s.number)}
                                className="w-full px-3 py-2 flex items-center justify-between"
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
                                <pre className="px-3 py-2 text-xs overflow-auto bg-gray-50 text-left">
                                  {loadingStep === key
                                    ? "Loading log..."
                                    : logCache[key] || "No log available"}
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

                          {aiForJob === job.id && aiText && (
                            <div className="mt-3 p-3 rounded-lg border bg-white prose prose-sm max-w-none">
                              <div className="text-xs text-gray-500 mb-1">
                                AI suggestion
                              </div>
                              <div
                                className="whitespace-pre-wrap"
                                style={{ fontFamily: "ui-sans-serif" }}
                              >
                                {aiText}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}