import api from "./api";

export const getMe = async () => (await api.get("/me")).data;

export const saveGitConfig = async (payload) =>
  (await api.post("/me/config", payload)).data;