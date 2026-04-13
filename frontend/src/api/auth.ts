import client from "./client";

export const registerAPI = (data: { name: string; email: string; password: string }) =>
  client.post("/auth/register", data);

export const loginAPI = (data: { email: string; password: string }) =>
  client.post("/auth/login", data);