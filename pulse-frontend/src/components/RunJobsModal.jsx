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
  the `Authorization` header and responds with a wildcard `Access-Control-Allow-Origin`.
  // Including credentials would trigger CORS preflight failures.
});

// Attach auth token (if any) to every request. Many endpoints such as
// organization listing, pipeline refresh and AI suggestions require the
// bearer token to be sent explicitly. Without this interceptor the calls
// were failing with 401 which resulted in empty organizations and no
// dynamic updates.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function fetchOrganizations() {
  // Normalize backend responses which may return `{ orgs: [...] }` or a plain
  // array. Returning just the array keeps the consumer logic simple and avoids
  // treating the object itself as an array which previously resulted in a
  // failed organizations dropdown.
  const { data } = await api.get("/github/organizations");
  if (Array.isArray(data)) return data;
  return data?.orgs || [];
}

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

  const { data } = await api.get("/github/job-log", { params });
  return data; // { text: '...' }
}

/** Ask the Gemini backend for a fix suggestion */
export async function aiSuggest({ errorText = "", stepsLog = "" }) {
  const { data } = await api.post("/ai/suggest", { errorText, stepsLog });
  return data; // { suggestion }
}