import axios from "axios";

const api = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8080/api", 
  headers: { "Content-Type": "application/json" }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;
