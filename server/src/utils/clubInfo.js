/**
 * 멀티 테넌트 전환을 위한 클럽 정보 유틸리티
 * 
 * MVP 단계: 단일 클럽 모드 (하드코딩된 기본값)
 * 전환 후: 멀티 테넌트 모드 (req.club에서 가져오기)
 */

/**
 * 멀티 테넌트 모드 여부 확인
 * 
 * 활성화 조건:
 * 1. 환경 변수 MULTI_TENANT_MODE === 'true'
 * 2. 또는 req.query.club 파라미터가 있음 (쿼리 파라미터 기반 강제 활성화)
 */
export const isMultiTenantMode = (req = null) => {
  // 쿼리 파라미터가 있으면 강제로 멀티테넌트 모드 활성화
  // 이것이 환경 변수보다 우선순위가 높음
  if (req && req.query && req.query.club) {
    console.log(`[ClubInfo] 멀티테넌트 모드 활성화 (쿼리 파라미터): ${req.query.club}`);
    return true;
  }
  
  // 환경 변수 확인
  const envMode = process.env.MULTI_TENANT_MODE === 'true';
  if (envMode) {
    console.log(`[ClubInfo] 멀티테넌트 모드 활성화 (환경 변수)`);
  }
  return envMode;
};

/**
 * 클럽 필터 반환
 * MVP: null (모든 데이터 조회)
 * 전환 후: req.club.id (클럽별 필터)
 */
export const getClubFilter = (req) => {
  // req를 전달하여 쿼리 파라미터 기반 멀티테넌트 모드 활성화 확인
  if (isMultiTenantMode(req) && req.club?.id) {
    console.log(`[ClubInfo] 클럽 필터 적용: ${req.club.name} (${req.club.subdomain}) - ID: ${req.club.id}`);
    return req.club.id;
  }
  
  // 멀티테넌트 모드이지만 req.club이 없는 경우 경고
  if (isMultiTenantMode(req) && !req.club) {
    console.warn(`[ClubInfo] ⚠️ 멀티테넌트 모드이지만 req.club이 없습니다. req.query.club:`, req.query?.club);
  }
  
  // MVP: null 반환 (필터 없음)
  console.log(`[ClubInfo] 클럽 필터 없음 (MVP 모드 또는 req.club 없음)`);
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
 * 기본 클럽(default)일 때는 clubId=NULL 레거시 데이터도 포함
 */
export const buildClubWhere = (req, additionalWhere = {}) => {
  const clubId = getClubFilter(req);
  
  if (clubId) {
    // 기본 클럽(default)인 경우 clubId=NULL 레거시 데이터도 포함
    const clubSubdomain = req.club?.subdomain;
    if (clubSubdomain === 'default') {
      console.log(`[ClubInfo] 기본 클럽 필터 (레거시 데이터 포함): clubId=${clubId}`);
      return {
        ...additionalWhere,
        OR: [
          { clubId },
          { clubId: null }, // 레거시 데이터 호환
        ],
      };
    }
    
    // 다른 클럽은 정확히 해당 clubId만 조회
    console.log(`[ClubInfo] 클럽 필터 적용: clubId=${clubId} (${clubSubdomain})`);
    return {
      ...additionalWhere,
      clubId,
    };
  }
  
  // MVP: clubId가 null인 경우 필터 없음
  console.log(`[ClubInfo] 클럽 필터 없음 (모든 데이터 조회)`);
  return additionalWhere;
};

