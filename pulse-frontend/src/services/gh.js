// frontend/src/services/gh.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
  // Do not send cookies by default. The backend expects the auth token in the
  // Authorization header and responds with a wildcard `Access-Control-Allow-Origin`.
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

/** Build a compact text log for a job or step (for AI or UI) */
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
