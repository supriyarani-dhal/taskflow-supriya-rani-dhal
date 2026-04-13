import client from "./client";

export const getProjectsAPI = () => client.get("/projects");
export const createProjectAPI = (data: { name: string; description?: string }) =>
  client.post("/projects", data);
export const getProjectAPI = (id: string) => client.get(`/projects/${id}`);
export const updateProjectAPI = (id: string, data: { name?: string; description?: string }) =>
  client.patch(`/projects/${id}`, data);
export const deleteProjectAPI = (id: string) => client.delete(`/projects/${id}`);