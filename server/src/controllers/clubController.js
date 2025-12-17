// Club 관련 API (Owner 대시보드/운영 도구용)
import { hashSecret } from "../utils/secretHash.js";
import { getKoreanTodayStart } from "../utils/timezone.js";

// GET /api/clubs?q=...
export const getAllClubs = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();

    const where =
      q.length > 0
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { subdomain: { contains: q, mode: "insensitive" } },
            ],
          }
        : {};

    const clubs = await req.prisma.club.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(clubs);
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return res.status(500).json({ error: "Failed to fetch clubs" });
  }
};

// POST /api/clubs
export const createClub = async (req, res) => {
  try {
    const name = (req.body?.name || "").toString().trim();
    const subdomain = (req.body?.subdomain || "").toString().trim();

    if (!name || !subdomain) {
      return res.status(400).json({
        error: "Missing fields",
        message: "name, subdomain은 필수입니다.",
      });
    }

    // 안전한 서브도메인 제한(알파벳/숫자/하이픈)
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(subdomain)) {
      return res.status(400).json({
        error: "Invalid subdomain",
        message: "subdomain은 영문/숫자/하이픈만 허용됩니다.",
      });
    }

    const club = await req.prisma.club.create({
      data: { name, subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(club);
  } catch (error) {
    console.error("Error creating club:", error);
    // unique constraint
    if (error?.code === "P2002") {
      return res.status(409).json({ error: "Subdomain already exists" });
    }
    return res.status(500).json({ error: "Failed to create club" });
  }
};

// PUT /api/clubs/:subdomain/credentials
export const setClubCredentials = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const joinCode = (req.body?.joinCode || "").toString();
    const adminPassword = (req.body?.adminPassword || "").toString();

    if (!joinCode && !adminPassword) {
      return res.status(400).json({
        error: "Missing fields",
        message: "joinCode 또는 adminPassword 중 하나 이상이 필요합니다.",
      });
    }

    const club = await req.prisma.club.findUnique({
      where: { subdomain },
      select: { id: true, name: true, subdomain: true },
    });
    if (!club) return res.status(404).json({ error: "Club not found" });

    const data = {};
    if (joinCode) data.joinCodeHash = hashSecret(joinCode);
    if (adminPassword) data.adminPasswordHash = hashSecret(adminPassword);

    const updated = await req.prisma.club.update({
      where: { subdomain },
      data,
      select: {
        id: true,
        name: true,
        subdomain: true,
        updatedAt: true,
        // 해시는 반환하지 않음
      },
    });

    return res.json({ ok: true, club: updated });
  } catch (error) {
    console.error("Error setting club credentials:", error);
    return res.status(500).json({ error: "Failed to set club credentials" });
  }
};

// GET /api/clubs/:subdomain/summary
export const getClubSummaryBySubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const club = await req.prisma.club.findUnique({
      where: { subdomain },
      select: { id: true, name: true, subdomain: true },
    });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    // "한 번에 다 불러오지 않기" 원칙:
    // - 요약은 count만 제공 (목록/상세는 클럽 선택 후 기존 화면에서 로드)
    const todayStart = getKoreanTodayStart();

    const [
      users,
      sessions,
      matches,
      attendances,
      latestSession,
      todayVisitors,
    ] = await Promise.all([
      req.prisma.user.count({ where: { clubId: club.id } }),
      req.prisma.session.count({ where: { clubId: club.id } }),
      req.prisma.match.count({ where: { clubId: club.id } }),
      req.prisma.attendance.count({
        where: { session: { clubId: club.id } },
      }),
      // 최신 세션 1개만 조회 (지연 로드/경량)
      req.prisma.session.findFirst({
        where: { clubId: club.id },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
      // 오늘 접속자(고유) 수: 방문 로그의 day(한국 날짜 시작) 기준
      req.prisma?.visit?.count
        ? req.prisma.visit
            .count({ where: { clubId: club.id, day: todayStart } })
            .catch((e) => {
              // 마이그레이션 전(테이블 없음)에도 요약이 깨지지 않게
              if (e?.code === "P2022") return 0;
              throw e;
            })
        : 0,
    ]);

    return res.json({
      club,
      counts: { users, sessions, matches, attendances },
      latestSessionDate: latestSession?.date || null,
      todayVisitors: todayVisitors ?? 0,
    });
  } catch (error) {
    console.error("Error fetching club summary:", error);
    return res.status(500).json({ error: "Failed to fetch club summary" });
  }
};
