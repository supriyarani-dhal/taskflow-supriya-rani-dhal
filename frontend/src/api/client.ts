import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach JWT to every request automatically
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If token expires, redirect to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRequest = err.config?.url?.includes("/auth/login");

    // Redirect ONLY if token expired during protected API call
    if (err.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default client;