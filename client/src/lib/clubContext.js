/**
 * 클럽 컨텍스트 유틸리티
 *
 * 멀티 테넌트 모드에서 클럽 정보를 감지하고 관리합니다.
 * MVP 모드에서는 기본 클럽을 사용합니다.
 */

/**
 * 서브도메인에서 클럽 식별자 추출
 */
export function getSubdomain() {
  if (typeof window === "undefined") {
    return null;
  }

  const host = (window.location.hostname || "").toLowerCase();
  const parts = host.split(".");

  // localhost / IP는 서브도메인 기반 멀티테넌트가 아님
  const isIp = host.match(/^\d{1,3}(\.\d{1,3}){3}$/);
  const isLocalhost = host === "localhost" || host.endsWith(".localhost") || isIp;

  // Render/Vercel 같은 호스팅 도메인의 서브도메인은 "클럽"이 아님
  const isHostingDomain = host.endsWith(".onrender.com") || host.endsWith(".vercel.app");

  // 커스텀 도메인에서만 서브도메인 추출
  if (!isLocalhost && !isHostingDomain && parts.length >= 3 && parts[0] && !parts[0].match(/^\d+$/)) {
    return parts[0];
  }

  return null;
}

/**
 * 멀티 테넌트 모드 확인
 * 환경 변수 또는 설정에서 확인
 */
export function isMultiTenantMode() {
  // 프로덕션에서는 환경 변수로 확인
  // 개발 모드에서는 기본적으로 false (MVP 모드)
  return import.meta.env.VITE_MULTI_TENANT_MODE === "true";
}

/**
 * 현재 클럽 식별자 가져오기
 */
export function getClubIdentifier() {
  if (isMultiTenantMode()) {
    // 멀티 테넌트 모드: 우선순위에 따라 클럽 식별자 추출
    const canUseStorage =
      typeof window !== "undefined" &&
      typeof window.localStorage !== "undefined";
    const saveLastClub = (club) => {
      if (!canUseStorage) return;
      try {
        window.localStorage.setItem("lastClubIdentifier", club);
      } catch {
        // ignore
      }
    };

    // 1순위: URL 쿼리 파라미터 (로컬 개발 환경에서 유용)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const clubParam = urlParams.get("club");
      if (clubParam) {
        console.log("[ClubContext] 클럽 식별자 (URL 파라미터):", clubParam);
        // 탭 이동으로 쿼리스트링이 사라져도 동일 클럽을 유지할 수 있도록 저장
        saveLastClub(clubParam);
        return clubParam;
      }
    }

    // 2순위: 서브도메인에서 추출 (프로덕션 환경)
    const subdomain = getSubdomain();
    if (subdomain) {
      console.log("[ClubContext] 클럽 식별자 (서브도메인):", subdomain);
      saveLastClub(subdomain);
      return subdomain;
    }

    // 3순위: 마지막으로 선택된 클럽
    // - 로컬 개발(localhost)에서만 허용 (탭 이동/리로드 시 ?club=... 유실 대응)
    // - 프로덕션/호스팅 도메인에서는 "기본 도메인(굿모닝)이 다른 클럽으로 바뀌는" 문제를 막기 위해 사용하지 않음
    const host = (typeof window !== "undefined" && window.location?.hostname
      ? window.location.hostname
      : "").toLowerCase();
    const isIp = host.match(/^\d{1,3}(\.\d{1,3}){3}$/);
    const isLocalhost = host === "localhost" || host.endsWith(".localhost") || isIp;
    if (canUseStorage && isLocalhost) {
      try {
        const lastClub = window.localStorage.getItem("lastClubIdentifier");
        if (lastClub) {
          console.log("[ClubContext] 클럽 식별자 (localStorage):", lastClub);
          return lastClub;
        }
      } catch {
        // ignore
      }
    }

    // 4순위: 환경 변수에서 기본값
    // 굿모닝(기본 도메인)은 항상 default를 기본값으로 사용
    const defaultSubdomain = import.meta.env.VITE_CLUB_SUBDOMAIN || "default";
    console.log("[ClubContext] 클럽 식별자 (환경 변수):", defaultSubdomain);
    return defaultSubdomain;
  }

  // MVP 모드: 기본 클럽 사용
  const defaultClub = import.meta.env.VITE_CLUB_SUBDOMAIN || "default";
  console.log("[ClubContext] MVP 모드 - 기본 클럽:", defaultClub);
  return defaultClub;
}

/**
 * API 호출에 클럽 정보 추가
 * 멀티 테넌트 모드일 때만 헤더에 포함
 */
export function getClubHeaders() {
  if (!isMultiTenantMode()) {
    return {};
  }

  const clubIdentifier = getClubIdentifier();
  if (clubIdentifier) {
    return {
      "X-Club-Subdomain": clubIdentifier,
    };
  }

  return {};
}

/**
 * API 엔드포인트에 클럽 쿼리 파라미터 추가
 * 멀티 테넌트 모드일 때만 추가
 */
export function addClubQueryParam(url) {
  if (!isMultiTenantMode()) {
    return url;
  }

  const clubIdentifier = getClubIdentifier();
  if (!clubIdentifier) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}club=${encodeURIComponent(clubIdentifier)}`;
}

/**
 * 고유 방문자(브라우저/기기) 식별자
 * - 오늘 접속자 수(고유 방문자) 집계에 사용
 */
export function getOrCreateVisitorId() {
  if (typeof window === "undefined") return null;
  try {
    const key = "visitorId";
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;

    const id =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    return null;
  }
}
