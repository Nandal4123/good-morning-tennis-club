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
    // 멀티 테넌트 모드가 아니더라도, 요청에서 club을 명시했으면 해석한다.
    // (Vercel/Render 환경변수 설정 실수에도 `?club=...`가 동작하도록)
    const explicit =
      !!req.get('X-Club-Subdomain') || !!req.query.club;
    if (!isMultiTenantMode() && !explicit) {
      return next();
    }

    // 클럽 식별자 추출
    let subdomain = null;

    // ✅ 우선순위:
    // 1) 헤더(X-Club-Subdomain) 2) 쿼리(?club=) 3) 커스텀 도메인 서브도메인
    // Render/Vercel 같은 호스팅 도메인(onrender.com, vercel.app)의 서브도메인은 "클럽"이 아님

    // 방법 1: 헤더에서 추출 (X-Club-Subdomain)
    if (req.get('X-Club-Subdomain')) {
      subdomain = req.get('X-Club-Subdomain');
    }

    // 방법 2: 쿼리 파라미터에서 추출 (로컬/테스트/프록시용)
    if (!subdomain && req.query.club) {
      subdomain = req.query.club;
    }

    // 방법 3: 호스트 서브도메인에서 추출 (커스텀 도메인일 때만)
    const host = (req.get('host') || '').toLowerCase();
    const hostname = host.split(':')[0]; // 포트 제거
    const isIp = hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/);
    const isLocalhost =
      hostname === 'localhost' || hostname.endsWith('.localhost') || isIp;
    const isHostingDomain =
      hostname.endsWith('.onrender.com') || hostname.endsWith('.vercel.app');

    if (!subdomain && !isLocalhost && !isHostingDomain) {
      const hostParts = hostname.split('.');
      // 예: ace.tennisapp.com → ace
      if (hostParts.length >= 3 && hostParts[0]) {
        subdomain = hostParts[0];
      }
    }

    // 방법 4: 환경 변수에서 기본값
    if (!subdomain) {
      subdomain = process.env.CLUB_SUBDOMAIN || 'default';
    }

    // 클럽 조회
    const club = await req.prisma.club.findUnique({
      where: { subdomain },
    });

    if (!club) {
      console.warn(`[Club Resolver] 클럽을 찾을 수 없음: ${subdomain}`);
      
      // 기본 클럽 찾기 시도 (개발/프로덕션 모두)
      const defaultClub = await req.prisma.club.findFirst({
        where: { subdomain: 'default' },
      });
      
      if (defaultClub) {
        console.log(`[Club Resolver] 기본 클럽 사용: ${defaultClub.name} (${defaultClub.subdomain})`);
        req.club = defaultClub;
        return next();
      }
      
      return res.status(404).json({ 
        error: 'Club not found',
        subdomain,
        message: `클럽을 찾을 수 없습니다: ${subdomain}. (기본 클럽 'default'도 없습니다)`,
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
    if (req.get('X-Club-Subdomain')) {
      subdomain = req.get('X-Club-Subdomain');
    }
    if (!subdomain && req.query.club) {
      subdomain = req.query.club;
    }

    const host = (req.get('host') || '').toLowerCase();
    const hostname = host.split(':')[0];
    const isIp = hostname.match(/^\d{1,3}(\.\d{1,3}){3}$/);
    const isLocalhost =
      hostname === 'localhost' || hostname.endsWith('.localhost') || isIp;
    const isHostingDomain =
      hostname.endsWith('.onrender.com') || hostname.endsWith('.vercel.app');
    if (!subdomain && !isLocalhost && !isHostingDomain) {
      const hostParts = hostname.split('.');
      if (hostParts.length >= 3 && hostParts[0]) {
        subdomain = hostParts[0];
      }
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

