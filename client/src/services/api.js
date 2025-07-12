import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  signup: (userData) => api.post("/auth/register", userData),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/update-profile", data),
};

export const userAPI = {
  getProfile: () => api.get("/users/me"),
  updateProfile: (data) => api.put("/users/me", data),
  getUsers: (params) => api.get("/users", { params }),
  getUserById: (id) => api.get(`/users/${id}`),
};

export const swapAPI = {
  getSwaps: (params) => api.get("/swaps", { params }),
  getSwapById: (id) => api.get(`/swaps/${id}`),
  createSwap: (data) => api.post("/swaps", data),
  updateSwap: (id, data) => api.put(`/swaps/${id}`, data),
  deleteSwap: (id) => api.delete(`/swaps/${id}`),
  acceptSwap: (id) => api.put(`/swaps/${id}/accept`),
  rejectSwap: (id) => api.put(`/swaps/${id}/reject`),
};

export const sessionAPI = {
  getSessions: (params) => api.get("/sessions", { params }),
  getSessionById: (id) => api.get(`/sessions/${id}`),
  createSession: (data) => api.post("/sessions", data),
  updateSession: (id, data) => api.put(`/sessions/${id}`, data),
};

export const messageAPI = {
  getMessages: (swapId) => api.get(`/messages?swapId=${swapId}`),
  sendMessage: (data) => api.post("/messages", data),
};

export const feedbackAPI = {
  createFeedback: (data) => api.post("/feedback", data),
  getFeedback: (params) => api.get("/feedback", { params }),
};
