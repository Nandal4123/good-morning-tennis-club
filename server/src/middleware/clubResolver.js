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
    // req를 전달하여 쿼리 파라미터 기반 강제 활성화 확인
    if (!isMultiTenantMode(req)) {
      console.log(`[Club Resolver] 멀티테넌트 모드 비활성화 - 클럽 해석 스킵`);
      return next();
    }

    // 클럽 식별자 추출
    // 우선순위: 쿼리 파라미터 > 헤더 > 서브도메인 > 환경 변수
    let subdomain = null;
    const host = req.get('host') || '';
    
    // 호스팅 도메인 확인 (.onrender.com, .vercel.app 등)
    const hostingDomains = ['.onrender.com', '.vercel.app', '.netlify.app', '.railway.app'];
    const isHostingDomain = hostingDomains.some(domain => host.endsWith(domain));

    // 방법 1: 쿼리 파라미터에서 추출 (최우선, 호스팅 도메인에서 필수)
    // 호스팅 도메인에서는 서브도메인을 사용할 수 없으므로 쿼리 파라미터가 필수
    if (req.query.club && req.query.club.trim()) {
      subdomain = req.query.club.trim();
      console.log(`[Club Resolver] 클럽 식별자 (쿼리 파라미터, 최우선): ${subdomain}`);
    }

    // 방법 2: 헤더에서 추출 (X-Club-Subdomain)
    if (!subdomain && req.get('X-Club-Subdomain')) {
      subdomain = req.get('X-Club-Subdomain').trim();
      console.log(`[Club Resolver] 클럽 식별자 (헤더): ${subdomain}`);
    }

    // 방법 3: 서브도메인에서 추출 (호스팅 도메인이 아닐 때만)
    if (!subdomain && !isHostingDomain) {
      const hostParts = host.split('.');
      // localhost나 IP 주소가 아니고, 호스팅 도메인이 아닌 경우에만 서브도메인 추출
      if (hostParts.length >= 3 && !hostParts[0].match(/^\d+$/)) {
        subdomain = hostParts[0];
        console.log(`[Club Resolver] 클럽 식별자 (서브도메인): ${subdomain}`);
      }
    }

    // 방법 4: 환경 변수에서 기본값 (개발용)
    if (!subdomain) {
      subdomain = process.env.CLUB_SUBDOMAIN || 'default';
      console.log(`[Club Resolver] 클럽 식별자 (환경 변수, 기본값): ${subdomain}`);
    }

    // 클럽 조회
    console.log(`[Club Resolver] 클럽 조회 시도: subdomain="${subdomain}"`);
    const club = await req.prisma.club.findUnique({
      where: { subdomain },
    });

    if (!club) {
      // 호스팅 도메인인 경우 경고 메시지 출력하지 않음
      const hostingDomains = ['.onrender.com', '.vercel.app', '.netlify.app', '.railway.app'];
      const isHostingDomain = hostingDomains.some(domain => host.endsWith(domain));
      
      console.error(`[Club Resolver] ❌ 클럽을 찾을 수 없음: ${subdomain}`);
      console.error(`[Club Resolver]   요청된 subdomain: "${subdomain}"`);
      console.error(`[Club Resolver]   호스팅 도메인: ${isHostingDomain}`);
      
      // 모든 클럽 목록 확인 (디버깅용)
      const allClubs = await req.prisma.club.findMany({
        select: { subdomain: true, name: true },
      });
      console.error(`[Club Resolver]   데이터베이스에 있는 클럽 목록:`, allClubs.map(c => `${c.name} (${c.subdomain})`));
      
      // 쿼리 파라미터로 명시적으로 요청된 경우에는 기본 클럽으로 폴백하지 않음
      // 명시적 요청은 반드시 해당 클럽이 존재해야 함
      if (req.query.club && req.query.club.trim() === subdomain) {
        console.error(`[Club Resolver]   명시적 클럽 요청이지만 클럽이 존재하지 않음 - 404 반환`);
        return res.status(404).json({ 
          error: 'Club not found',
          subdomain,
          message: `클럽을 찾을 수 없습니다: ${subdomain}`,
          availableClubs: allClubs.map(c => ({ subdomain: c.subdomain, name: c.name })),
        });
      }
      
      // 기본 클럽 찾기 시도 (쿼리 파라미터가 아닌 경우에만)
      const defaultClub = await req.prisma.club.findFirst({
        where: { subdomain: 'default' },
      });
      
      if (defaultClub) {
        console.warn(`[Club Resolver] ⚠️ 기본 클럽으로 폴백: ${defaultClub.name} (${defaultClub.subdomain})`);
        console.warn(`[Club Resolver]   원래 요청: ${subdomain}`);
        req.club = defaultClub;
        return next();
      }
      
      return res.status(404).json({ 
        error: 'Club not found',
        subdomain,
        message: `클럽을 찾을 수 없습니다: ${subdomain}`,
        availableClubs: allClubs.map(c => ({ subdomain: c.subdomain, name: c.name })),
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
    
    // 호스팅 도메인 무시 (.onrender.com, .vercel.app 등)
    const hostingDomains = ['.onrender.com', '.vercel.app', '.netlify.app', '.railway.app'];
    const isHostingDomain = hostingDomains.some(domain => host.endsWith(domain));
    
    if (hostParts.length >= 3 && !hostParts[0].match(/^\d+$/) && !isHostingDomain) {
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

