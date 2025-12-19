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

  const host = window.location.hostname;
  const parts = host.split(".");

  // 호스팅 도메인 무시 (.onrender.com, .vercel.app 등)
  const hostingDomains = [
    ".onrender.com",
    ".vercel.app",
    ".netlify.app",
    ".railway.app",
  ];
  const isHostingDomain = hostingDomains.some((domain) =>
    host.endsWith(domain)
  );

  // localhost나 IP 주소가 아니고, 호스팅 도메인이 아닌 경우에만 서브도메인 추출
  if (parts.length >= 3 && !parts[0].match(/^\d+$/) && !isHostingDomain) {
    return parts[0];
  }

  return null;
}

/**
 * 멀티 테넌트 모드 확인
 * 환경 변수 또는 설정에서 확인
 *
 * 우선순위:
 * 1. URL 쿼리 파라미터 (?club=) - 최우선, 강제 활성화
 * 2. 환경 변수 (VITE_MULTI_TENANT_MODE)
 */
export function isMultiTenantMode() {
  // URL에 ?club= 파라미터가 있으면 강제로 멀티 테넌트 모드 활성화
  // 이것이 최우선이며, 환경 변수보다 우선순위가 높음
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const clubParam = urlParams.get("club");
    if (clubParam) {
      console.log(
        "[ClubContext] 멀티테넌트 모드 활성화 (URL 파라미터):",
        clubParam
      );
      return true;
    }
  }

  // 프로덕션에서는 환경 변수로 확인
  // 개발 모드에서는 기본적으로 false (MVP 모드)
  const envMode = import.meta.env.VITE_MULTI_TENANT_MODE === "true";
  if (envMode) {
    console.log("[ClubContext] 멀티테넌트 모드 활성화 (환경 변수)");
  }
  return envMode;
}

/**
 * 현재 클럽 식별자 가져오기
 *
 * 우선순위 (멀티테넌트 모드):
 * 1. URL 쿼리 파라미터 (?club=) - 최우선
 * 2. 서브도메인 (호스팅 도메인 제외)
 * 3. localStorage (lastClubIdentifier)
 * 4. 환경 변수 (VITE_CLUB_SUBDOMAIN)
 */
export function getClubIdentifier() {
  const canUseStorage =
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

  const saveLastClub = (club) => {
    if (!canUseStorage) return;
    try {
      window.localStorage.setItem("lastClubIdentifier", club);
      console.log("[ClubContext] localStorage에 클럽 식별자 저장:", club);
    } catch (error) {
      console.warn("[ClubContext] localStorage 저장 실패:", error);
    }
  };

  // 멀티테넌트 모드 확인
  const isMultiTenant = isMultiTenantMode();

  if (isMultiTenant) {
    // 멀티 테넌트 모드: 우선순위에 따라 클럽 식별자 추출

    // 1순위: URL 쿼리 파라미터 (최우선, 강제)
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const clubParam = urlParams.get("club");
      if (clubParam && clubParam.trim()) {
        const trimmed = clubParam.trim();
        console.log(
          "[ClubContext] ✅ 클럽 식별자 (URL 파라미터, 최우선):",
          trimmed
        );
        // 탭 이동으로 쿼리스트링이 사라져도 동일 클럽을 유지할 수 있도록 저장
        saveLastClub(trimmed);
        return trimmed;
      }
    }

    // 2순위: 서브도메인에서 추출 (프로덕션 환경, 호스팅 도메인 제외)
    const subdomain = getSubdomain();
    if (subdomain) {
      console.log("[ClubContext] ✅ 클럽 식별자 (서브도메인):", subdomain);
      saveLastClub(subdomain);
      return subdomain;
    }

    // 3순위: 마지막으로 선택된 클럽 (localStorage)
    // 주의: URL 파라미터가 없을 때만 사용 (URL 파라미터가 우선)
    if (canUseStorage) {
      try {
        const lastClub = window.localStorage.getItem("lastClubIdentifier");
        if (lastClub && lastClub.trim()) {
          const trimmed = lastClub.trim();
          console.log(
            "[ClubContext] ⚠️ 클럽 식별자 (localStorage, URL 파라미터 없음):",
            trimmed
          );
          return trimmed;
        }
      } catch (error) {
        console.warn("[ClubContext] localStorage 읽기 실패:", error);
      }
    }

    // 4순위: 환경 변수에서 기본값
    const defaultSubdomain = import.meta.env.VITE_CLUB_SUBDOMAIN || null;
    if (defaultSubdomain) {
      console.log(
        "[ClubContext] ⚠️ 클럽 식별자 (환경 변수, 기본값):",
        defaultSubdomain
      );
      return defaultSubdomain;
    }

    // 멀티테넌트 모드인데 클럽 식별자를 찾을 수 없음
    console.warn(
      "[ClubContext] ⚠️ 멀티테넌트 모드이지만 클럽 식별자를 찾을 수 없습니다."
    );
    return null;
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
