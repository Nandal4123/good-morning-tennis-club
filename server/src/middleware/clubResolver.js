/**
 * 클럽 해석 미들웨어
 * 
 * 요청에서 클럽 정보를 추출하여 req.club에 설정합니다.
 * 
 * 지원 방식:
 * 1. 서브도메인 방식: club-name.tennisapp.com
 * 2. 헤더 방식: X-Club-Subdomain 헤더
 * 3. 쿼리 파라미터: ?club=club-name (개발용)
 */

import { isMultiTenantMode } from '../utils/clubInfo.js';

/**
 * 클럽 해석 미들웨어
 */
export const resolveClub = async (req, res, next) => {
  try {
    // 멀티 테넌트 모드가 아니면 스킵
    if (!isMultiTenantMode()) {
      return next();
    }

    // 클럽 식별자 추출
    let subdomain = null;

    // 방법 1: 서브도메인에서 추출
    const host = req.get('host') || '';
    const hostParts = host.split('.');
    
    // localhost나 IP 주소가 아닌 경우 서브도메인 추출
    if (hostParts.length >= 3 && !hostParts[0].match(/^\d+$/)) {
      subdomain = hostParts[0];
    }

    // 방법 2: 헤더에서 추출 (X-Club-Subdomain)
    if (!subdomain && req.get('X-Club-Subdomain')) {
      subdomain = req.get('X-Club-Subdomain');
    }

    // 방법 3: 쿼리 파라미터에서 추출 (개발용)
    if (!subdomain && req.query.club) {
      subdomain = req.query.club;
    }

    // 방법 4: 환경 변수에서 기본값 (개발용)
    if (!subdomain) {
      subdomain = process.env.CLUB_SUBDOMAIN || 'default';
    }

    // 클럽 조회
    const club = await req.prisma.club.findUnique({
      where: { subdomain },
    });

    if (!club) {
      console.warn(`[Club Resolver] 클럽을 찾을 수 없음: ${subdomain}`);
      
      // 개발 모드에서는 기본 클럽 생성 시도
      if (process.env.NODE_ENV === 'development') {
        const defaultClub = await req.prisma.club.findFirst({
          where: { subdomain: 'default' },
        });
        
        if (defaultClub) {
          req.club = defaultClub;
          return next();
        }
      }
      
      return res.status(404).json({ 
        error: 'Club not found',
        subdomain,
        message: `클럽을 찾을 수 없습니다: ${subdomain}`,
      });
    }

    // 클럽 상태 확인
    // TODO: 나중에 ClubStatus enum 추가 시 활성화
    // if (club.status !== 'ACTIVE') {
    //   return res.status(403).json({ 
    //     error: 'Club is not active',
    //     message: '클럽이 비활성화되었습니다.',
    //   });
    // }

    // req.club에 설정
    req.club = club;
    
    console.log(`[Club Resolver] 클럽 확인: ${club.name} (${club.subdomain})`);
    
    next();
  } catch (error) {
    console.error('[Club Resolver] 오류:', error);
    return res.status(500).json({
      error: 'Failed to resolve club',
      message: error.message,
    });
  }
};

/**
 * 선택적 클럽 해석 미들웨어
 * 클럽이 없어도 계속 진행 (기본 클럽 사용)
 */
export const resolveClubOptional = async (req, res, next) => {
  try {
    if (!isMultiTenantMode()) {
      return next();
    }

    // 클럽 해석 시도
    let subdomain = null;
    const host = req.get('host') || '';
    const hostParts = host.split('.');
    
    if (hostParts.length >= 3 && !hostParts[0].match(/^\d+$/)) {
      subdomain = hostParts[0];
    }

    if (!subdomain && req.get('X-Club-Subdomain')) {
      subdomain = req.get('X-Club-Subdomain');
    }

    if (!subdomain && req.query.club) {
      subdomain = req.query.club;
    }

    if (subdomain) {
      const club = await req.prisma.club.findUnique({
        where: { subdomain },
      });
      
      if (club) {
        req.club = club;
      }
    }

    // 클럽이 없어도 계속 진행 (기본값 사용)
    next();
  } catch (error) {
    console.error('[Club Resolver Optional] 오류:', error);
    // 오류가 있어도 계속 진행
    next();
  }
};

