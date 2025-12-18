// Club 관련 API (Owner 대시보드/운영 도구용)

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


