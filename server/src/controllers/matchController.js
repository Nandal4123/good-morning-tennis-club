import {
  buildClubWhere,
  getClubFilter,
  getClubInfo,
} from "../utils/clubInfo.js";

// Get all matches
export const getAllMatches = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const clubId = getClubFilter(req);

    const where = buildClubWhere(req);
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const matches = await req.prisma.match.findMany({
      where,
      include: {
        participants: {
          include: { user: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    });

    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
};

// Get match by ID
export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = getClubFilter(req);

    const where = { id };
    if (clubId) {
      where.clubId = clubId;
    }

    const match = await req.prisma.match.findUnique({
      where,
      include: {
        participants: {
          include: { user: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.json(match);
  } catch (error) {
    console.error("Error fetching match:", error);
    res.status(500).json({ error: "Failed to fetch match" });
  }
};

// Create new match
export const createMatch = async (req, res) => {
  try {
    const { date, type, participants, createdBy } = req.body;

    // 멀티 테넌트: clubId 자동 할당
    let clubId = getClubFilter(req);
    if (!clubId) {
      // MVP 모드: 기본 클럽 ID 사용
      const clubInfo = getClubInfo(req);
      const defaultClubId = clubInfo.id;

      // 기본 클럽이 실제 Club 레코드인지 확인
      if (defaultClubId && defaultClubId !== "default-club") {
        const club = await req.prisma.club.findUnique({
          where: { id: defaultClubId },
        });
        if (club) {
          clubId = club.id;
        }
      }
    }

    // KST 정오(12:00)로 설정하여 시간대 문제 방지
    // "2025-12-02" → 2025-12-02T12:00:00+09:00 (KST) → 2025-12-02T03:00:00.000Z (UTC)
    const kstDate = new Date(date + "T12:00:00+09:00");

    // 경기 생성
    const match = await req.prisma.match.create({
      data: {
        date: kstDate,
        type: type || "DOUBLES",
        createdBy: createdBy || null, // 등록자 ID 저장
        clubId: clubId || null, // 멀티 테넌트 모드가 아니면 null
        participants: {
          create: participants.map((p) => ({
            userId: p.userId,
            team: p.team,
            score: p.score || 0,
          })),
        },
      },
      include: {
        participants: {
          include: { user: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // 자동 출석 생성: 해당 날짜의 세션 찾기 또는 생성
    // KST 기준으로 하루 범위 정확히 계산
    const dayStart = new Date(date + "T00:00:00+09:00");
    const dayEnd = new Date(date + "T23:59:59.999+09:00");
    const nextDayStart = new Date(dayStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    // 해당 날짜의 세션 찾기 (하루 범위 내, 클럽 필터 적용)
    const sessionWhere = {
      date: {
        gte: dayStart,
        lt: nextDayStart, // 다음 날 시작 전까지
      },
    };
    if (clubId) {
      sessionWhere.clubId = clubId;
    }

    let session = await req.prisma.session.findFirst({
      where: sessionWhere,
      orderBy: { date: "asc" }, // 가장 이른 세션 사용
    });

    // 세션이 없으면 생성
    if (!session) {
      session = await req.prisma.session.create({
        data: {
          date: kstDate,
          description: `Morning Session - ${date}`,
          clubId: clubId || null, // 멀티 테넌트 모드가 아니면 null
        },
      });
      console.log(`[Auto Attendance] Created new session for ${date}`);
    }

    // 각 참가자에 대해 출석 기록 생성 (중복 방지)
    // 게스트 사용자는 출석 기록을 생성하지 않음
    const participantUserIds = participants.map((p) => p.userId);

    for (const userId of participantUserIds) {
      // 🚫 게스트 사용자 확인: 게스트는 출석 기록 생성하지 않음
      const user = await req.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });

      // 게스트 사용자 체크: 이메일이 @guest.local로 끝나거나 이름에 👤가 포함된 경우
      const isGuest =
        user?.email?.endsWith("@guest.local") || user?.name?.startsWith("👤");

      if (isGuest) {
        console.log(
          `[Auto Attendance] Guest user ${userId} (${user?.name}) - skipping attendance creation`
        );
        continue;
      }

      // 🔒 중복 방지: 해당 날짜에 이미 출석이 있는지 확인 (클럽 필터 적용)
      const attendanceWhere = {
        userId,
        date: {
          gte: dayStart,
          lt: nextDayStart, // 다음 날 시작 전까지
        },
      };
      if (clubId) {
        attendanceWhere.user = { clubId };
      }

      const existingAttendance = await req.prisma.attendance.findFirst({
        where: attendanceWhere,
      });

      // 이미 해당 날짜에 출석이 있으면 스킵 (하루에 한 번만 출석 가능)
      if (existingAttendance) {
        console.log(
          `[Auto Attendance] User ${userId} already has attendance for ${date}, skipping...`
        );
        continue;
      }

      // 출석 기록 생성 (중복 없음이 확인됨)
      await req.prisma.attendance.create({
        data: {
          userId,
          sessionId: session.id,
          status: "ATTENDED",
          date: kstDate,
        },
      });
      console.log(
        `[Auto Attendance] Created attendance for user ${userId} (${user?.name}) on ${date}`
      );
    }

    console.log(
      `[Auto Attendance] Created attendance for ${participantUserIds.length} participants`
    );

    res.status(201).json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    res.status(500).json({ error: "Failed to create match" });
  }
};

// Update match
export const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type } = req.body;
    const clubId = getClubFilter(req);

    // 멀티 테넌트: 경기가 해당 클럽에 속하는지 확인
    if (clubId) {
      const existingMatch = await req.prisma.match.findUnique({
        where: { id },
        select: { clubId: true },
      });

      if (!existingMatch) {
        return res.status(404).json({ error: "Match not found" });
      }

      if (existingMatch.clubId !== clubId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // KST 정오(12:00)로 설정하여 시간대 문제 방지
    const kstDate = date ? new Date(date + "T12:00:00+09:00") : undefined;

    const match = await req.prisma.match.update({
      where: { id },
      data: {
        date: kstDate,
        type,
      },
      include: {
        participants: {
          include: { user: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Match not found" });
    }
    res.status(500).json({ error: "Failed to update match" });
  }
};

// Delete match
export const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = getClubFilter(req);

    // 멀티 테넌트: 경기가 해당 클럽에 속하는지 확인
    if (clubId) {
      const existingMatch = await req.prisma.match.findUnique({
        where: { id },
        select: { clubId: true },
      });

      if (!existingMatch) {
        return res.status(404).json({ error: "Match not found" });
      }

      if (existingMatch.clubId !== clubId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    await req.prisma.match.delete({
      where: { id },
    });

    res.json({ message: "Match deleted successfully" });
  } catch (error) {
    console.error("Error deleting match:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Match not found" });
    }
    res.status(500).json({ error: "Failed to delete match" });
  }
};

// Update match score
export const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantId, score } = req.body;
    const clubId = getClubFilter(req);

    // 멀티 테넌트: 경기가 해당 클럽에 속하는지 확인
    if (clubId) {
      const participant = await req.prisma.matchParticipant.findUnique({
        where: { id: participantId },
        include: {
          match: {
            select: { clubId: true },
          },
        },
      });

      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      if (participant.match.clubId !== clubId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const updatedParticipant = await req.prisma.matchParticipant.update({
      where: { id: participantId },
      data: { score },
      include: { user: true, match: true },
    });

    res.json(updatedParticipant);
  } catch (error) {
    console.error("Error updating score:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Participant not found" });
    }
    res.status(500).json({ error: "Failed to update score" });
  }
};

// Check for duplicate match (same 4 players within 30 minutes)
export const checkDuplicateMatch = async (req, res) => {
  try {
    const { date, playerIds } = req.body;
    const clubId = getClubFilter(req);

    if (!playerIds || playerIds.length !== 4) {
      return res.json({ isDuplicate: false, existingMatch: null });
    }

    // Sort player IDs for consistent comparison
    const sortedPlayerIds = [...playerIds].sort();

    // Calculate time range (±30 minutes from the given date)
    // KST 정오(12:00)로 설정
    const matchDate = new Date(date + "T12:00:00+09:00");
    const startTime = new Date(matchDate.getTime() - 30 * 60 * 1000);
    const endTime = new Date(matchDate.getTime() + 30 * 60 * 1000);

    // Find matches within the time range (클럽 필터 적용)
    const where = {
      date: {
        gte: startTime,
        lte: endTime,
      },
    };
    if (clubId) {
      where.clubId = clubId;
    }

    const recentMatches = await req.prisma.match.findMany({
      where,
      include: {
        participants: {
          include: { user: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Check if any match has the same 4 players
    for (const match of recentMatches) {
      const matchPlayerIds = match.participants.map((p) => p.userId).sort();

      // Compare sorted player IDs
      if (
        matchPlayerIds.length === sortedPlayerIds.length &&
        matchPlayerIds.every((id, index) => id === sortedPlayerIds[index])
      ) {
        return res.json({
          isDuplicate: true,
          existingMatch: {
            id: match.id,
            date: match.date,
            participants: match.participants,
            teamA: match.participants.filter((p) => p.team === "A"),
            teamB: match.participants.filter((p) => p.team === "B"),
          },
        });
      }
    }

    res.json({ isDuplicate: false, existingMatch: null });
  } catch (error) {
    console.error("Error checking duplicate match:", error);
    res.status(500).json({ error: "Failed to check duplicate match" });
  }
};

// Get matches by user
export const getMatchesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    const clubId = getClubFilter(req);

    // 멀티 테넌트: 사용자가 해당 클럽에 속하는지 확인
    if (clubId) {
      const user = await req.prisma.user.findUnique({
        where: { id: userId },
        select: { clubId: true },
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.clubId !== clubId) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const where = {
      participants: {
        some: { userId },
      },
    };
    if (clubId) {
      where.clubId = clubId;
    }

    const matches = await req.prisma.match.findMany({
      where,
      include: {
        participants: {
          include: { user: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
      take: limit ? parseInt(limit) : undefined,
    });

    res.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
};
