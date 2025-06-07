import axios from "axios";

const api = axios.create({
  baseURL: "/api/", // Hit the reverse proxy which sends to Django
  withCredentials: true,
});

let refreshRetries = 0;
const maxRefreshRetries = 3;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshRetries < maxRefreshRetries &&
      originalRequest.url !== "/auth/login/" &&
      originalRequest.url !== "/auth/signup/" &&
      originalRequest.url !== "/auth/verify-otp/" &&
      originalRequest.url !== "/auth/logout/" &&
      originalRequest.url !== "/auth/user/"
    ) {
      originalRequest._retry = true;
      refreshRetries += 1;
      try {
        await axios.post(
          "/api/auth/token/refresh/",
          {},
          { withCredentials: true }
        );
        refreshRetries = 0;
        return api(originalRequest);
      } catch (err) {
        console.error("Token refresh failed:", err);
        refreshRetries = 0;
        window.location.href = "/?auth=login";
        return Promise.reject(err);
      }
    }

    if (error.response?.status === 400) {
      console.error("Bad Request:", error.response.data);
    }

    return Promise.reject(error);
  }
);

export default api;
