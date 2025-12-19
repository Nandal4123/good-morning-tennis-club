// 클럽 컨텍스트 유틸리티 import
import {
  getClubHeaders,
  addClubQueryParam,
  isMultiTenantMode,
  getClubIdentifier,
} from "./clubContext.js";

// API Base URL 설정
// 로컬 개발: 항상 http://localhost:5001/api 사용
// 프로덕션: 환경 변수 또는 기본 배포 서버 URL 사용
const API_BASE = (() => {
  // 개발 모드 확인: Vite의 import.meta.env.DEV 사용 (가장 안정적)
  // import.meta.env.DEV는 개발 모드에서 true, 프로덕션 빌드에서 false
  const isDevelopment = import.meta.env.DEV;

  if (isDevelopment) {
    // 로컬 개발 환경: 항상 localhost 사용 (환경 변수 무시)
    // .env, .env.local, .env.development 파일의 VITE_API_URL 설정을 무시
    // 이렇게 하면 어떤 환경 변수가 설정되어 있어도 로컬에서는 항상 localhost 사용
    const localApiUrl = "http://localhost:5001/api";
    console.log("[API] 🔧 개발 모드 감지: API_BASE =", localApiUrl);
    console.log(
      "[API] 📝 참고: .env 파일의 VITE_API_URL은 무시됩니다 (로컬 개발용)"
    );
    return localApiUrl;
  }

  // 프로덕션 환경
  // 1순위: 환경 변수 VITE_API_URL (배포 플랫폼에서 설정)
  // 2순위: 기본 배포 서버 URL
  const prodApiUrl =
    import.meta.env.VITE_API_URL ||
    "https://tennis-club-server.onrender.com/api";
  console.log("[API] 🚀 프로덕션 모드: API_BASE =", prodApiUrl);
  if (import.meta.env.VITE_API_URL) {
    console.log("[API] ✅ 환경 변수 VITE_API_URL 사용");
  } else {
    console.log("[API] ⚠️ 환경 변수 없음, 기본 배포 서버 URL 사용");
  }
  return prodApiUrl;
})();

// Helper function for API calls
async function fetchApi(endpoint, options = {}) {
  // 멀티 테넌트 모드 확인
  const isMultiTenant = isMultiTenantMode();
  const clubIdentifier = getClubIdentifier();
  
  // 멀티 테넌트 모드일 때 클럽 쿼리 파라미터 추가
  const endpointWithClub = addClubQueryParam(endpoint);
  const url = `${API_BASE}${endpointWithClub}`;

  // 멀티 테넌트 모드일 때 클럽 헤더 추가
  const clubHeaders = getClubHeaders();

  console.log(
    `[API] 📞 Calling: ${url}`,
    options.method ? `(${options.method})` : "",
    isMultiTenant ? "[멀티 테넌트 모드]" : "[MVP 모드]",
    clubIdentifier ? `[클럽: ${clubIdentifier}]` : "[클럽: 없음]"
  );

  // 디버깅: 실제 URL에 클럽 파라미터가 포함되었는지 확인
  if (isMultiTenant && clubIdentifier) {
    const urlHasClub =
      url.includes(`club=${encodeURIComponent(clubIdentifier)}`) ||
      url.includes(`club=${clubIdentifier}`);
    const hasHeader = !!clubHeaders["X-Club-Subdomain"];
    
    if (!urlHasClub && !hasHeader) {
      console.error("[API] ❌ 클럽 파라미터가 URL 또는 헤더에 포함되지 않았습니다!");
      console.error("[API]   endpoint:", endpoint);
      console.error("[API]   endpointWithClub:", endpointWithClub);
      console.error("[API]   clubIdentifier:", clubIdentifier);
      console.error("[API]   isMultiTenantMode:", isMultiTenant);
      console.error("[API]   URL에 club 파라미터:", urlHasClub);
      console.error("[API]   헤더에 X-Club-Subdomain:", hasHeader);
    } else {
      console.log("[API] ✅ 클럽 파라미터 확인:", {
        urlHasClub,
        hasHeader,
        clubIdentifier,
      });
    }
  } else if (isMultiTenant && !clubIdentifier) {
    console.warn("[API] ⚠️ 멀티테넌트 모드이지만 클럽 식별자가 없습니다!");
  }

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...clubHeaders, // 클럽 헤더 추가
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = "Request failed";
      try {
        const error = await response.json();
        errorMessage =
          error.error ||
          error.message ||
          `HTTP ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error(
        `[API] ❌ Error ${response.status} from ${url}:`,
        errorMessage
      );
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log(`[API] ✅ Success from ${url}:`, data);
    return data;
  } catch (error) {
    // 네트워크 에러나 기타 에러 처리
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error(`[API] ❌ Network error: Failed to fetch ${url}`, error);
      throw new Error(
        `네트워크 오류: 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.`
      );
    }
    console.error(`[API] ❌ Unexpected error from ${url}:`, error);
    throw error;
  }
}

// User API
export const userApi = {
  getAll: () => fetchApi("/users"),
  getAllWithStats: () => fetchApi("/users/with-stats"),
  getAllWithMonthlyStats: (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchApi(`/users/with-monthly-stats${queryString}`);
  },
  getById: (id) => fetchApi(`/users/${id}`),
  create: (data) =>
    fetchApi("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    fetchApi(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id) => fetchApi(`/users/${id}`, { method: "DELETE" }),
  deleteMultiple: (userIds) =>
    fetchApi("/users/delete-multiple", {
      method: "POST",
      body: JSON.stringify({ userIds }),
    }),
  getStats: (id) => fetchApi(`/users/${id}/stats`),
  getHeadToHead: (userId, opponentId) =>
    fetchApi(`/users/${userId}/versus/${opponentId}`),
};

// Session API
export const sessionApi = {
  getAll: () => fetchApi("/sessions"),
  getById: (id) => fetchApi(`/sessions/${id}`),
  getToday: () => fetchApi("/sessions/today"),
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
  checkDuplicate: (date, playerIds) =>
    fetchApi("/matches/check-duplicate", {
      method: "POST",
      body: JSON.stringify({ date, playerIds }),
    }),
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

// Club API
export const clubApi = {
  getInfo: () => fetchApi("/club/info"),
};

// Clubs API (Owner 대시보드용)
export const clubsApi = {
  list: (q = "") => {
    const params = new URLSearchParams();
    if (q) params.append("q", q);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    return fetchApi(`/clubs${queryString}`);
  },
  getSummary: (subdomain) =>
    fetchApi(`/clubs/${encodeURIComponent(subdomain)}/summary`),
  get: (subdomain) => fetchApi(`/clubs/${encodeURIComponent(subdomain)}`),
  create: (data) =>
    fetchApi("/clubs", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAdminPassword: (subdomain, password) =>
    fetchApi(`/clubs/${encodeURIComponent(subdomain)}/admin-password`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    }),
  updateJoinCode: (subdomain, joinCode) =>
    fetchApi(`/clubs/${encodeURIComponent(subdomain)}/join-code`, {
      method: "PUT",
      body: JSON.stringify({ joinCode }),
    }),
};
