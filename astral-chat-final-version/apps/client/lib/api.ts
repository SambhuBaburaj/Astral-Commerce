import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  // Add any request interceptors here, e.g., auth headers
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;
