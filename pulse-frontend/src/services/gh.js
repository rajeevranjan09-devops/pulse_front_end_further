// frontend/src/services/gh.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000",
  withCredentials: true,
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

  const { data } = await api.get("/github/run-jobs", {
    params: { owner, repo, runId: String(runId) },
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
