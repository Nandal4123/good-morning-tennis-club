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
    const { email, name, tennisLevel, goals, languagePref, profileMetadata } =
      req.body;

    const user = await req.prisma.user.update({
      where: { id },
      data: {
        email,
        name,
        tennisLevel,
        goals,
        languagePref,
        profileMetadata,
      },
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

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;

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

      // 내 팀 점수와 상대팀 점수 계산
      const myTeamScore = match.participants
        .filter((p) => p.team === myTeam)
        .reduce((max, p) => Math.max(max, p.score), 0);
      const opponentScore = match.participants
        .filter((p) => p.team !== myTeam)
        .reduce((max, p) => Math.max(max, p.score), 0);

      if (myTeamScore > opponentScore) {
        winCount++;
      }
    }

    const user = await req.prisma.user.findUnique({
      where: { id },
      select: { name: true, tennisLevel: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
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
    res.status(500).json({ error: "Failed to fetch user statistics" });
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
      const myTeamScore = match.participants
        .filter((p) => p.team === myTeam)
        .reduce((max, p) => Math.max(max, p.score), 0);
      const opponentTeamScore = match.participants
        .filter((p) => p.team === opponentTeam)
        .reduce((max, p) => Math.max(max, p.score), 0);

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
