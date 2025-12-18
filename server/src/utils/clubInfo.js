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
 * 클럽 필터 반환
 * MVP: null (모든 데이터 조회)
 * 전환 후: req.club.id (클럽별 필터)
 */
export const getClubFilter = (req) => {
  if (isMultiTenantMode() && req.club?.id) {
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
 * default 클럽인 경우 clubId NULL 데이터도 포함해야 하는지 확인
 */
export const shouldIncludeNullClubIdForDefault = (req) => {
  if (!isMultiTenantMode()) {
    return true; // MVP 모드에서는 항상 포함
  }
  
  const clubInfo = getClubInfo(req);
  return clubInfo.subdomain === "default" || clubInfo.id === "default-club";
};

/**
 * 클럽 필터를 포함한 where 조건 생성
 */
export const buildClubWhere = (req, additionalWhere = {}) => {
  const clubId = getClubFilter(req);
  const allowNull = shouldIncludeNullClubIdForDefault(req);
  
  if (clubId) {
    if (allowNull) {
      // default 클럽인 경우 clubId가 null인 데이터도 포함
      return {
        ...additionalWhere,
        OR: [
          { clubId },
          { clubId: null },
        ],
      };
    }
    return {
      ...additionalWhere,
      clubId,
    };
  }
  
  // MVP: clubId가 null인 경우 필터 없음
  return additionalWhere;
};

