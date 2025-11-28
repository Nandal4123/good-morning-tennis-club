const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://tennis-club-server.onrender.com/api"
    : "/api");

// Helper function for API calls
async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// User API
export const userApi = {
  getAll: () => fetchApi("/users"),
  getById: (id) => fetchApi(`/users/${id}`),
  create: (data) =>
    fetchApi("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/users/${id}`, { method: "DELETE" }),
  getStats: (id) => fetchApi(`/users/${id}/stats`),
  getHeadToHead: (userId, opponentId) =>
    fetchApi(`/users/${userId}/versus/${opponentId}`),
};

// Session API
export const sessionApi = {
  getAll: () => fetchApi("/sessions"),
  getById: (id) => fetchApi(`/sessions/${id}`),
  getToday: () => fetchApi("/sessions/today/current"),
  create: (data) =>
    fetchApi("/sessions", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/sessions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/sessions/${id}`, { method: "DELETE" }),
};

// Attendance API
export const attendanceApi = {
  getAll: (params) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : "";
    return fetchApi(`/attendances${queryString}`);
  },
  getBySession: (sessionId) => fetchApi(`/attendances/session/${sessionId}`),
  getByUser: (userId, limit) => {
    const queryString = limit ? `?limit=${limit}` : "";
    return fetchApi(`/attendances/user/${userId}${queryString}`);
  },
  mark: (data) =>
    fetchApi("/attendances", { method: "POST", body: JSON.stringify(data) }),
  quickCheckIn: (userId) =>
    fetchApi("/attendances/checkin", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  update: (id, data) =>
    fetchApi(`/attendances/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id) => fetchApi(`/attendances/${id}`, { method: "DELETE" }),
};

// Match API
export const matchApi = {
  getAll: (params) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : "";
    return fetchApi(`/matches${queryString}`);
  },
  getById: (id) => fetchApi(`/matches/${id}`),
  getByUser: (userId, limit) => {
    const queryString = limit ? `?limit=${limit}` : "";
    return fetchApi(`/matches/user/${userId}${queryString}`);
  },
  create: (data) =>
    fetchApi("/matches", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/matches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/matches/${id}`, { method: "DELETE" }),
  updateScore: (id, participantId, score) =>
    fetchApi(`/matches/${id}/score`, {
      method: "POST",
      body: JSON.stringify({ participantId, score }),
    }),
};

// Feedback API
export const feedbackApi = {
  getAll: (params) => {
    const queryString = params ? `?${new URLSearchParams(params)}` : "";
    return fetchApi(`/feedbacks${queryString}`);
  },
  getById: (id) => fetchApi(`/feedbacks/${id}`),
  getByUser: (userId, limit) => {
    const queryString = limit ? `?limit=${limit}` : "";
    return fetchApi(`/feedbacks/user/${userId}${queryString}`);
  },
  create: (data) =>
    fetchApi("/feedbacks", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/feedbacks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/feedbacks/${id}`, { method: "DELETE" }),
};

// Health check
export const healthCheck = () => fetchApi("/health");
