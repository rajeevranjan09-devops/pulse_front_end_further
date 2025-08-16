// frontend/src/services/gh.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
  withCredentials: true,
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
  const { data } = await api.get("/github/organizations");
  return data;
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
    (runOrId && (runOrId.runId ?? runOrId.id)) !== undefined
      ? (runOrId.runId ?? runOrId.id)
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

/** Build a compact text log for a job (for AI) */
export async function fetchJobLog(owner, repo, runId, jobId) {
  const { data } = await api.get("/github/job-log", {
    params: { owner, repo, runId: String(runId), jobId: String(jobId) },
  });
  return data; // { text: '...' }
}

/** Ask the Gemini backend for a fix suggestion */
export async function aiSuggest({ errorText = "", stepsLog = "" }) {
  const { data } = await api.post("/ai/suggest", { errorText, stepsLog });
  return data; // { suggestion }
}
