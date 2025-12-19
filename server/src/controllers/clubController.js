// Club 관련 API (Owner 대시보드/운영 도구용)
import { hashSecret } from "../utils/secretHash.js";

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
    const [users, sessions, matches, attendances] = await Promise.all([
      req.prisma.user.count({ where: { clubId: club.id } }),
      req.prisma.session.count({ where: { clubId: club.id } }),
      req.prisma.match.count({ where: { clubId: club.id } }),
      req.prisma.attendance.count({
        where: { session: { clubId: club.id } },
      }),
    ]);

    return res.json({
      club,
      counts: { users, sessions, matches, attendances },
    });
  } catch (error) {
    console.error("Error fetching club summary:", error);
    return res.status(500).json({ error: "Failed to fetch club summary" });
  }
};

// POST /api/clubs (클럽 생성)
export const createClub = async (req, res) => {
  try {
    const { name, subdomain, adminPassword, joinCode } = req.body;

    // 필수 필드 검증
    if (!name || !subdomain) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "클럽 이름과 서브도메인은 필수입니다.",
      });
    }

    // 서브도메인 형식 검증 (영문자, 숫자, 하이픈만 허용)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(subdomain)) {
      return res.status(400).json({
        error: "Invalid subdomain format",
        message: "서브도메인은 영문자, 숫자, 하이픈만 사용할 수 있습니다.",
      });
    }

    // 서브도메인 중복 확인
    const existing = await req.prisma.club.findUnique({
      where: { subdomain },
    });

    if (existing) {
      return res.status(409).json({
        error: "Subdomain already exists",
        message: "이미 사용 중인 서브도메인입니다.",
      });
    }

    // 관리자 비밀번호 해시 생성
    let adminPasswordHash = null;
    if (adminPassword) {
      adminPasswordHash = hashSecret(adminPassword);
    }

    // 가입 코드 해시 생성
    let joinCodeHash = null;
    if (joinCode) {
      joinCodeHash = hashSecret(joinCode);
    }

    // 클럽 생성
    const club = await req.prisma.club.create({
      data: {
        name: name.trim(),
        subdomain: subdomain.trim().toLowerCase(),
        adminPasswordHash,
        joinCodeHash,
      },
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
    return res.status(500).json({
      error: "Failed to create club",
      message: error.message,
    });
  }
};

// GET /api/clubs/:subdomain (클럽 상세 정보)
export const getClubBySubdomain = async (req, res) => {
  try {
    const { subdomain } = req.params;

    const club = await req.prisma.club.findUnique({
      where: { subdomain },
      select: {
        id: true,
        name: true,
        subdomain: true,
        createdAt: true,
        updatedAt: true,
        adminPasswordHash: true, // 비밀번호 해시 존재 여부만 확인
        joinCodeHash: true, // 가입 코드 해시 존재 여부만 확인
      },
    });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    // 해시 값은 반환하지 않고 존재 여부만 반환
    return res.json({
      ...club,
      hasAdminPassword: !!club.adminPasswordHash,
      hasJoinCode: !!club.joinCodeHash,
      adminPasswordHash: undefined, // 보안상 제거
      joinCodeHash: undefined, // 보안상 제거
    });
  } catch (error) {
    console.error("Error fetching club:", error);
    return res.status(500).json({ error: "Failed to fetch club" });
  }
};

// PUT /api/clubs/:subdomain/admin-password (관리자 비밀번호 변경)
export const updateAdminPassword = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: "Missing password",
        message: "비밀번호를 입력해주세요.",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        error: "Password too short",
        message: "비밀번호는 최소 4자 이상이어야 합니다.",
      });
    }

    const club = await req.prisma.club.findUnique({
      where: { subdomain },
    });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    const adminPasswordHash = hashSecret(password);

    await req.prisma.club.update({
      where: { id: club.id },
      data: { adminPasswordHash },
    });

    return res.json({
      success: true,
      message: "관리자 비밀번호가 변경되었습니다.",
    });
  } catch (error) {
    console.error("Error updating admin password:", error);
    return res.status(500).json({
      error: "Failed to update admin password",
      message: error.message,
    });
  }
};

// PUT /api/clubs/:subdomain/join-code (가입 코드 변경)
export const updateJoinCode = async (req, res) => {
  try {
    const { subdomain } = req.params;
    const { joinCode } = req.body;

    if (!joinCode) {
      return res.status(400).json({
        error: "Missing join code",
        message: "가입 코드를 입력해주세요.",
      });
    }

    if (joinCode.length < 4) {
      return res.status(400).json({
        error: "Join code too short",
        message: "가입 코드는 최소 4자 이상이어야 합니다.",
      });
    }

    const club = await req.prisma.club.findUnique({
      where: { subdomain },
    });

    if (!club) {
      return res.status(404).json({ error: "Club not found" });
    }

    const joinCodeHash = hashSecret(joinCode);

    await req.prisma.club.update({
      where: { id: club.id },
      data: { joinCodeHash },
    });

    return res.json({
      success: true,
      message: "가입 코드가 변경되었습니다.",
    });
  } catch (error) {
    console.error("Error updating join code:", error);
    return res.status(500).json({
      error: "Failed to update join code",
      message: error.message,
    });
  }
};
