// Get all matches
export const getAllMatches = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    
    const where = {};
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
          include: { user: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

// Get match by ID
export const getMatchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const match = await req.prisma.match.findUnique({
      where: { id },
      include: {
        participants: {
          include: { user: true }
        }
      }
    });
    
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
};

// Create new match
export const createMatch = async (req, res) => {
  try {
    const { date, type, participants } = req.body;
    
    // KST 정오(12:00)로 설정하여 시간대 문제 방지
    // "2025-12-02" → 2025-12-02T12:00:00+09:00 (KST) → 2025-12-02T03:00:00.000Z (UTC)
    const kstDate = new Date(date + 'T12:00:00+09:00');
    
    // 경기 생성
    const match = await req.prisma.match.create({
      data: {
        date: kstDate,
        type: type || 'DOUBLES',
        participants: {
          create: participants.map(p => ({
            userId: p.userId,
            team: p.team,
            score: p.score || 0
          }))
        }
      },
      include: {
        participants: {
          include: { user: true }
        }
      }
    });
    
    // 자동 출석 생성: 해당 날짜의 세션 찾기 또는 생성
    const dayStart = new Date(date + 'T00:00:00+09:00');
    const dayEnd = new Date(date + 'T23:59:59+09:00');
    
    let session = await req.prisma.session.findFirst({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd
        }
      }
    });
    
    // 세션이 없으면 생성
    if (!session) {
      session = await req.prisma.session.create({
        data: {
          date: kstDate,
          description: `Morning Session - ${date}`
        }
      });
      console.log(`[Auto Attendance] Created new session for ${date}`);
    }
    
    // 각 참가자에 대해 출석 기록 생성 (이미 있으면 스킵)
    const participantUserIds = participants.map(p => p.userId);
    
    for (const userId of participantUserIds) {
      await req.prisma.attendance.upsert({
        where: {
          userId_sessionId: { userId, sessionId: session.id }
        },
        update: {}, // 이미 있으면 변경하지 않음
        create: {
          userId,
          sessionId: session.id,
          status: 'ATTENDED',
          date: kstDate
        }
      });
    }
    
    console.log(`[Auto Attendance] Created attendance for ${participantUserIds.length} participants`);
    
    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
};

// Update match
export const updateMatch = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type } = req.body;
    
    // KST 정오(12:00)로 설정하여 시간대 문제 방지
    const kstDate = date ? new Date(date + 'T12:00:00+09:00') : undefined;
    
    const match = await req.prisma.match.update({
      where: { id },
      data: {
        date: kstDate,
        type
      },
      include: {
        participants: {
          include: { user: true }
        }
      }
    });
    
    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(500).json({ error: 'Failed to update match' });
  }
};

// Delete match
export const deleteMatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.prisma.match.delete({
      where: { id }
    });
    
    res.json({ message: 'Match deleted successfully' });
  } catch (error) {
    console.error('Error deleting match:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.status(500).json({ error: 'Failed to delete match' });
  }
};

// Update match score
export const updateScore = async (req, res) => {
  try {
    const { id } = req.params;
    const { participantId, score } = req.body;
    
    const participant = await req.prisma.matchParticipant.update({
      where: { id: participantId },
      data: { score },
      include: { user: true, match: true }
    });
    
    res.json(participant);
  } catch (error) {
    console.error('Error updating score:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Participant not found' });
    }
    res.status(500).json({ error: 'Failed to update score' });
  }
};

// Check for duplicate match (same 4 players within 30 minutes)
export const checkDuplicateMatch = async (req, res) => {
  try {
    const { date, playerIds } = req.body;
    
    if (!playerIds || playerIds.length !== 4) {
      return res.json({ isDuplicate: false, existingMatch: null });
    }
    
    // Sort player IDs for consistent comparison
    const sortedPlayerIds = [...playerIds].sort();
    
    // Calculate time range (±30 minutes from the given date)
    // KST 정오(12:00)로 설정
    const matchDate = new Date(date + 'T12:00:00+09:00');
    const startTime = new Date(matchDate.getTime() - 30 * 60 * 1000);
    const endTime = new Date(matchDate.getTime() + 30 * 60 * 1000);
    
    // Find matches within the time range
    const recentMatches = await req.prisma.match.findMany({
      where: {
        date: {
          gte: startTime,
          lte: endTime
        }
      },
      include: {
        participants: {
          include: { user: true }
        }
      }
    });
    
    // Check if any match has the same 4 players
    for (const match of recentMatches) {
      const matchPlayerIds = match.participants.map(p => p.userId).sort();
      
      // Compare sorted player IDs
      if (matchPlayerIds.length === sortedPlayerIds.length &&
          matchPlayerIds.every((id, index) => id === sortedPlayerIds[index])) {
        return res.json({
          isDuplicate: true,
          existingMatch: {
            id: match.id,
            date: match.date,
            participants: match.participants,
            teamA: match.participants.filter(p => p.team === 'A'),
            teamB: match.participants.filter(p => p.team === 'B')
          }
        });
      }
    }
    
    res.json({ isDuplicate: false, existingMatch: null });
  } catch (error) {
    console.error('Error checking duplicate match:', error);
    res.status(500).json({ error: 'Failed to check duplicate match' });
  }
};

// Get matches by user
export const getMatchesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    
    const matches = await req.prisma.match.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: { user: true }
        }
      },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });
    
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

