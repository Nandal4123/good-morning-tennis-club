/**
 * 멀티 테넌트 전환을 위한 클럽 정보 유틸리티
 * 
 * MVP 단계: 단일 클럽 모드 (하드코딩된 기본값)
 * 전환 후: 멀티 테넌트 모드 (req.club에서 가져오기)
 */

/**
 * 멀티 테넌트 모드 여부 확인
 */
export const isMultiTenantMode = () => {
  return process.env.MULTI_TENANT_MODE === 'true';
};

/**
 * 요청에서 클럽을 명시했는지(헤더/쿼리) 판단
 * - 환경변수 설정 실수에도 `?club=...`는 항상 동작하도록 하기 위함
 */
export const hasExplicitClubInRequest = (req) => {
  try {
    const header = req?.get?.('X-Club-Subdomain');
    const query = req?.query?.club;
    return !!(header || query);
  } catch {
    return false;
  }
};

/**
 * default 클럽(굿모닝)에서 과거 데이터 호환을 위해 clubId가 NULL인 레코드를 포함할지 여부
 * - 기본값: true (안전한 전환)
 * - 끄려면: DEFAULT_CLUB_INCLUDES_NULL=false
 */
export const shouldIncludeNullClubIdForDefault = (req) => {
  // 멀티테넌트 모드이거나, 요청에서 클럽을 명시한 경우에는 동작
  if (!isMultiTenantMode() && !hasExplicitClubInRequest(req)) return false;
  if ((process.env.DEFAULT_CLUB_INCLUDES_NULL || '').toLowerCase() === 'false') {
    return false;
  }
  return req?.club?.subdomain === 'default';
};

/**
 * 클럽 필터 반환
 * MVP: null (모든 데이터 조회)
 * 전환 후: req.club.id (클럽별 필터)
 */
export const getClubFilter = (req) => {
  if ((isMultiTenantMode() || hasExplicitClubInRequest(req)) && req.club?.id) {
    return req.club.id;
  }
  // MVP: null 반환 (필터 없음)
  return null;
};

/**
 * 클럽 정보 반환
 * MVP: 기본 클럽 정보
 * 전환 후: req.club에서 가져오기
 */
export const getClubInfo = (req) => {
  if (isMultiTenantMode() && req.club) {
    return {
      id: req.club.id,
      name: req.club.name,
      subdomain: req.club.subdomain,
    };
  }
  
  // MVP: 기본 클럽 정보 반환
  return {
    id: process.env.DEFAULT_CLUB_ID || 'default-club',
    name: process.env.CLUB_NAME || 'Good Morning Club',
    subdomain: process.env.CLUB_SUBDOMAIN || 'default',
  };
};

/**
 * 클럽 필터를 포함한 where 조건 생성
 */
export const buildClubWhere = (req, additionalWhere = {}) => {
  const clubId = getClubFilter(req);
  
  if (clubId) {
    const where = { ...additionalWhere };

    // default 클럽: clubId가 NULL인 과거 레코드도 함께 조회
    if (shouldIncludeNullClubIdForDefault(req)) {
      const clubOr = { OR: [{ clubId }, { clubId: null }] };

      if (where.OR) {
        // 기존 OR 조건이 있으면 AND로 추가
        if (Array.isArray(where.AND)) where.AND = [...where.AND, clubOr];
        else if (where.AND) where.AND = [where.AND, clubOr];
        else where.AND = [clubOr];
      } else {
        where.OR = clubOr.OR;
      }

      return where;
    }

    where.clubId = clubId;
    return where;
  }
  
  // MVP: clubId가 null인 경우 필터 없음
  return additionalWhere;
};

