import {
  getKoreanTodayStart,
  getKoreanTomorrowStart,
} from "../utils/timezone.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await req.prisma.user.findUnique({
      where: { id },
      include: {
        attendances: {
          include: { session: true },
          orderBy: { date: "desc" },
          take: 10,
        },
        matchParticipants: {
          include: { match: true },
          orderBy: { match: { date: "desc" } },
          take: 10,
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const {
      email,
      name,
      role,
      tennisLevel,
      goals,
      languagePref,
      profileMetadata,
    } = req.body;

    console.log("Creating user with data:", { email, name, role, tennisLevel });

    const user = await req.prisma.user.create({
      data: {
        email,
        name,
        role: role || "USER",
        tennisLevel: tennisLevel || "NTRP_3_0",
        goals,
        languagePref: languagePref || "ko",
        profileMetadata,
      },
    });

    console.log("User created successfully:", user.id);
    res.status(201).json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    console.error("Error details:", error.message);
    if (error.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" });
    }
    // 개발 환경에서 상세 에러 반환
    res.status(500).json({
      error: "Failed to create user",
      details: error.message,
      code: error.code,
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      name,
      role,
      tennisLevel,
      goals,
      languagePref,
      profileMetadata,
    } = req.body;

    // 업데이트할 데이터 구성 (undefined가 아닌 값만 포함)
    const updateData = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (tennisLevel !== undefined) updateData.tennisLevel = tennisLevel;
    if (goals !== undefined) updateData.goals = goals;
    if (languagePref !== undefined) updateData.languagePref = languagePref;
    if (profileMetadata !== undefined)
      updateData.profileMetadata = profileMetadata;

    const user = await req.prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to update user" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await req.prisma.user.delete({
      where: { id },
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// Delete multiple users (admin only)
export const deleteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "No user IDs provided" });
    }

    // 삭제할 사용자 수 확인
    const usersToDelete = await req.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    if (usersToDelete.length === 0) {
      return res.status(404).json({ error: "No users found" });
    }

    // 일괄 삭제
    const result = await req.prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    res.json({
      message: `${result.count} users deleted successfully`,
      deletedCount: result.count,
      deletedUsers: usersToDelete.map((u) => u.name),
    });
  } catch (error) {
    console.error("Error deleting multiple users:", error);
    res.status(500).json({ error: "Failed to delete users" });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

    // 사용자 존재 확인
    const user = await req.prisma.user.findUnique({
      where: { id },
      select: { name: true, tennisLevel: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 출석 수
    const attendanceCount = await req.prisma.attendance.count({
      where: { userId: id, status: "ATTENDED" },
    });

    // 참가한 모든 경기 가져오기
    const userMatches = await req.prisma.matchParticipant.findMany({
      where: { userId: id },
      include: {
        match: {
          include: {
            participants: true,
          },
        },
      },
    });

    const matchCount = userMatches.length;

    // 승리 계산: 내 팀 점수가 상대팀 점수보다 높은 경기
    let winCount = 0;
    for (const participant of userMatches) {
      const myTeam = participant.team;
      const match = participant.match;
      const participants = match?.participants || [];

      if (participants.length === 0) continue;

      // 내 팀 점수와 상대팀 점수 계산
      const myTeamPlayers = participants.filter((p) => p.team === myTeam);
      const opponentPlayers = participants.filter((p) => p.team !== myTeam);

      const myTeamScore =
        myTeamPlayers.length > 0
          ? Math.max(...myTeamPlayers.map((p) => p.score || 0))
          : 0;
      const opponentScore =
        opponentPlayers.length > 0
          ? Math.max(...opponentPlayers.map((p) => p.score || 0))
          : 0;

      if (myTeamScore > opponentScore) {
        winCount++;
      }
    }

    // 전체 세션 수 가져오기 (출석률 계산용)
    const totalSessions = await req.prisma.session.count();

    res.json({
      ...user,
      stats: {
        totalAttendance: attendanceCount,
        totalMatches: matchCount,
        wins: winCount,
        attendanceRate:
          totalSessions > 0
            ? Math.round((attendanceCount / totalSessions) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    console.error("Error details:", error.message);
    res.status(500).json({
      error: "Failed to fetch user statistics",
      details: error.message,
    });
  }
};

// Get head-to-head record between two users
export const getHeadToHead = async (req, res) => {
  try {
    const { id, opponentId } = req.params;

    // 내가 참가한 모든 경기 가져오기
    const myMatches = await req.prisma.matchParticipant.findMany({
      where: { userId: id },
      include: {
        match: {
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    // 상대방과 함께한 경기만 필터링
    const headToHeadMatches = myMatches.filter((mp) => {
      const opponentInMatch = mp.match.participants.some(
        (p) => p.userId === opponentId
      );
      return opponentInMatch;
    });

    let wins = 0;
    let losses = 0;
    let draws = 0;
    const matchHistory = [];

    for (const mp of headToHeadMatches) {
      const match = mp.match;
      const myTeam = mp.team;

      // 상대방 팀 확인
      const opponentParticipant = match.participants.find(
        (p) => p.userId === opponentId
      );
      const opponentTeam = opponentParticipant?.team;

      // 같은 팀이면 건너뛰기 (상대전적이 아님)
      if (myTeam === opponentTeam) continue;

      // 점수 계산
      const participants = match?.participants || [];
      const myTeamPlayers = participants.filter((p) => p.team === myTeam);
      const opponentTeamPlayers = participants.filter(
        (p) => p.team === opponentTeam
      );

      const myTeamScore =
        myTeamPlayers.length > 0
          ? Math.max(...myTeamPlayers.map((p) => p.score || 0))
          : 0;
      const opponentTeamScore =
        opponentTeamPlayers.length > 0
          ? Math.max(...opponentTeamPlayers.map((p) => p.score || 0))
          : 0;

      // 승/패/무 계산
      let result;
      if (myTeamScore > opponentTeamScore) {
        wins++;
        result = "WIN";
      } else if (myTeamScore < opponentTeamScore) {
        losses++;
        result = "LOSS";
      } else {
        draws++;
        result = "DRAW";
      }

      // 경기 기록 추가
      matchHistory.push({
        matchId: match.id,
        date: match.date,
        myTeam: match.participants
          .filter((p) => p.team === myTeam)
          .map((p) => p.user.name),
        opponentTeam: match.participants
          .filter((p) => p.team === opponentTeam)
          .map((p) => p.user.name),
        myScore: myTeamScore,
        opponentScore: opponentTeamScore,
        result,
      });
    }

    // 상대방 정보 가져오기
    const opponent = await req.prisma.user.findUnique({
      where: { id: opponentId },
      select: { id: true, name: true, tennisLevel: true },
    });

    res.json({
      opponent,
      stats: {
        wins,
        losses,
        draws,
        totalMatches: wins + losses + draws,
        winRate:
          wins + losses + draws > 0
            ? Math.round((wins / (wins + losses + draws)) * 100)
            : 0,
      },
      matchHistory: matchHistory.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      ),
    });
  } catch (error) {
    console.error("Error fetching head-to-head:", error);
    res.status(500).json({ error: "Failed to fetch head-to-head record" });
  }
};

// Get all users with monthly stats (for rankings)
export const getAllUsersWithMonthlyStats = async (req, res) => {
  try {
    console.log(`[API] 📊 /api/users/with-monthly-stats 호출됨`);
    console.log(`[API] Query params:`, req.query);
    // 쿼리 파라미터로 년/월 받기 (기본값: 현재 월)
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1; // 1-12
    console.log(`[API] 처리할 년/월: ${year}-${month}`);

    // 해당 월의 시작일과 종료일 계산 (KST 기준)
    const startDate = new Date(
      `${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`
    );

    // 오늘 날짜까지의 데이터만 조회 (KST 기준)
    // 현재 월이면 오늘까지, 과거 월이면 해당 월의 마지막 날까지
    const tomorrowKSTStart = getKoreanTomorrowStart(); // 오늘 날짜 포함을 위해 내일 시작 시간 사용

    const nextMonthStart = new Date(startDate);
    nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

    // 오늘 날짜의 다음 날 시작 시간과 선택한 월의 다음 달 시작일 중 더 작은 값 사용
    // 현재 월이면 오늘까지 (내일 시작 시간), 과거 월이면 해당 월의 마지막 날까지
    const endDate =
      tomorrowKSTStart < nextMonthStart ? tomorrowKSTStart : nextMonthStart;

    // 현재 월인지 확인
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const isCurrentMonth = year === currentYear && month === currentMonth;

    console.log(
      `[Monthly Stats] Period: ${startDate.toISOString()} ~ ${endDate.toISOString()}`
    );
    console.log(
      `[Monthly Stats] 현재 월 여부: ${
        isCurrentMonth ? "YES (오늘까지)" : "NO (전체 월)"
      }`
    );
    if (isCurrentMonth) {
      const kstEndDate = new Date(endDate.getTime() + 9 * 60 * 60 * 1000);
      console.log(
        `[Monthly Stats] 오늘 날짜 (KST): ${kstEndDate.getUTCFullYear()}-${String(
          kstEndDate.getUTCMonth() + 1
        ).padStart(2, "0")}-${String(kstEndDate.getUTCDate()).padStart(2, "0")}`
      );
    }

    // 모든 사용자 가져오기
    const users = await req.prisma.user.findMany({
      orderBy: { name: "asc" },
    });

    // 해당 월의 세션 수 (출석률 계산용)
    const monthSessions = await req.prisma.session.count({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // 각 사용자의 월별 통계 계산 (배치 처리로 연결 풀 제한 방지)
    const BATCH_SIZE = 5; // 한 번에 5명씩 처리
    const usersWithStats = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (user) => {
          // 해당 월 출석 수
          const attendanceCount = await req.prisma.attendance.count({
            where: {
              userId: user.id,
              status: "ATTENDED",
              date: {
                gte: startDate,
                lt: endDate,
              },
            },
          });

          // 해당 월 경기 참여 기록
          const matchParticipants = await req.prisma.matchParticipant.findMany({
            where: {
              userId: user.id,
              match: {
                date: {
                  gte: startDate,
                  lt: endDate,
                },
              },
            },
            include: {
              match: {
                include: {
                  participants: true,
                },
              },
            },
          });

          let wins = 0;
          let losses = 0;
          let draws = 0;

          for (const participant of matchParticipants) {
            const match = participant.match;
            const myTeam = participant.team;
            const participants = match?.participants || [];

            if (participants.length === 0) continue;

            const myTeamPlayers = participants.filter((p) => p.team === myTeam);
            const opponentPlayers = participants.filter(
              (p) => p.team !== myTeam
            );

            const myTeamScore =
              myTeamPlayers.length > 0
                ? Math.max(...myTeamPlayers.map((p) => p.score || 0))
                : 0;
            const opponentScore =
              opponentPlayers.length > 0
                ? Math.max(...opponentPlayers.map((p) => p.score || 0))
                : 0;

            if (myTeamScore > opponentScore) {
              wins++;
            } else if (myTeamScore < opponentScore) {
              losses++;
            } else {
              draws++;
            }
          }

          const totalGames = wins + losses + draws;
          const winRate =
            totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
          const attendanceRate =
            monthSessions > 0
              ? Math.round((attendanceCount / monthSessions) * 100)
              : 0;

          return {
            ...user,
            stats: {
              totalAttendance: attendanceCount,
              attendanceRate,
              totalMatches: totalGames,
              wins,
              losses,
              draws,
              winRate,
            },
          };
        })
      );
      usersWithStats.push(...batchResults);
    }

    res.json({
      year,
      month,
      users: usersWithStats,
    });
  } catch (error) {
    console.error("❌ Error fetching users with monthly stats:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    // 더 자세한 에러 정보 반환
    const errorResponse = {
      error: "Failed to fetch users with monthly stats",
      details: error.message || "Unknown error",
      type: error.name || "Error",
    };

    // Prisma 관련 오류인 경우 추가 정보
    if (
      error.name === "PrismaClientKnownRequestError" ||
      error.name === "PrismaClientInitializationError" ||
      error.message?.includes("MaxClientsInSessionMode") ||
      error.message?.includes("connection")
    ) {
      errorResponse.databaseError = true;
      errorResponse.suggestion =
        "Database connection pool limit reached. Please try again in a moment.";
    }

    res.status(500).json(errorResponse);
  }
};

// Get all users with stats (for admin)
export const getAllUsersWithStats = async (req, res) => {
  try {
    // 모든 사용자 가져오기
    const users = await req.prisma.user.findMany({
      orderBy: { name: "asc" },
    });

    // 모든 세션 수 (출석률 계산용)
    const totalSessions = await req.prisma.session.count();

    // 각 사용자의 통계 계산 (배치 처리로 연결 풀 제한 방지)
    const BATCH_SIZE = 5; // 한 번에 5명씩 처리
    const usersWithStats = [];

    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (user) => {
          // 출석 수
          const attendanceCount = await req.prisma.attendance.count({
            where: { userId: user.id, status: "ATTENDED" },
          });

          // 경기 참여 기록
          const matchParticipants = await req.prisma.matchParticipant.findMany({
            where: { userId: user.id },
            include: {
              match: {
                include: {
                  participants: true,
                },
              },
            },
          });

          let wins = 0;
          let losses = 0;
          let draws = 0;

          for (const participant of matchParticipants) {
            const match = participant.match;
            const myTeam = participant.team;
            const participants = match?.participants || [];

            if (participants.length === 0) continue;

            const myTeamPlayers = participants.filter((p) => p.team === myTeam);
            const opponentPlayers = participants.filter(
              (p) => p.team !== myTeam
            );

            const myTeamScore =
              myTeamPlayers.length > 0
                ? Math.max(...myTeamPlayers.map((p) => p.score || 0))
                : 0;
            const opponentScore =
              opponentPlayers.length > 0
                ? Math.max(...opponentPlayers.map((p) => p.score || 0))
                : 0;

            if (myTeamScore > opponentScore) {
              wins++;
            } else if (myTeamScore < opponentScore) {
              losses++;
            } else {
              draws++;
            }
          }

          const totalGames = wins + losses + draws;
          const winRate =
            totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
          const attendanceRate =
            totalSessions > 0
              ? Math.round((attendanceCount / totalSessions) * 100)
              : 0;

          return {
            ...user,
            stats: {
              totalAttendance: attendanceCount,
              attendanceRate,
              totalMatches: totalGames,
              wins,
              losses,
              draws,
              winRate,
            },
          };
        })
      );
      usersWithStats.push(...batchResults);
    }

    res.json(usersWithStats);
  } catch (error) {
    console.error("Error fetching users with stats:", error);
    res.status(500).json({ error: "Failed to fetch users with stats" });
  }
};
