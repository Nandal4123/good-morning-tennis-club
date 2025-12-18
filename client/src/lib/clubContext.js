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
  if (typeof window === 'undefined') {
    return null;
  }

  const host = window.location.hostname;
  const parts = host.split('.');

  // 호스팅 도메인 무시 (.onrender.com, .vercel.app 등)
  const hostingDomains = ['.onrender.com', '.vercel.app', '.netlify.app', '.railway.app'];
  const isHostingDomain = hostingDomains.some(domain => host.endsWith(domain));

  // localhost나 IP 주소가 아니고, 호스팅 도메인이 아닌 경우에만 서브도메인 추출
  if (parts.length >= 3 && !parts[0].match(/^\d+$/) && !isHostingDomain) {
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
  return import.meta.env.VITE_MULTI_TENANT_MODE === 'true';
}

/**
 * 현재 클럽 식별자 가져오기
 */
export function getClubIdentifier() {
  if (isMultiTenantMode()) {
    // 멀티 테넌트 모드: 우선순위에 따라 클럽 식별자 추출
    const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    const saveLastClub = (club) => {
      if (!canUseStorage) return;
      try {
        window.localStorage.setItem('lastClubIdentifier', club);
      } catch {
        // ignore
      }
    };
    
    // 1순위: URL 쿼리 파라미터 (로컬 개발 환경에서 유용)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const clubParam = urlParams.get('club');
      if (clubParam) {
        console.log('[ClubContext] 클럽 식별자 (URL 파라미터):', clubParam);
        // 탭 이동으로 쿼리스트링이 사라져도 동일 클럽을 유지할 수 있도록 저장
        saveLastClub(clubParam);
        return clubParam;
      }
    }
    
    // 2순위: 서브도메인에서 추출 (프로덕션 환경)
    const subdomain = getSubdomain();
    if (subdomain) {
      console.log('[ClubContext] 클럽 식별자 (서브도메인):', subdomain);
      saveLastClub(subdomain);
      return subdomain;
    }

    // 3순위: 마지막으로 선택된 클럽(로컬 개발에서 탭 이동 시 쿼리 유실 대응)
    if (canUseStorage) {
      try {
        const lastClub = window.localStorage.getItem('lastClubIdentifier');
        if (lastClub) {
          console.log('[ClubContext] 클럽 식별자 (localStorage):', lastClub);
          return lastClub;
        }
      } catch {
        // ignore
      }
    }
    
    // 4순위: 환경 변수에서 기본값
    const defaultSubdomain = import.meta.env.VITE_CLUB_SUBDOMAIN || null;
    console.log('[ClubContext] 클럽 식별자 (환경 변수):', defaultSubdomain);
    return defaultSubdomain;
  }

  // MVP 모드: 기본 클럽 사용
  const defaultClub = import.meta.env.VITE_CLUB_SUBDOMAIN || 'default';
  console.log('[ClubContext] MVP 모드 - 기본 클럽:', defaultClub);
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
      'X-Club-Subdomain': clubIdentifier,
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

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}club=${encodeURIComponent(clubIdentifier)}`;
}

