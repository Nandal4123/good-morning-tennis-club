import { getKoreanTodayRange, getKoreanTodayStart, getKoreanDateString } from '../utils/timezone.js';
import { buildClubWhere, getClubFilter, getClubInfo } from '../utils/clubInfo.js';

// Get all sessions
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await req.prisma.session.findMany({
      where: buildClubWhere(req),
      orderBy: { date: 'desc' },
      include: {
        _count: {
          select: { attendances: true }
        }
      }
    });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get session by ID
export const getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = getClubFilter(req);
    
    const where = { id };
    if (clubId) {
      where.clubId = clubId;
    }
    
    const session = await req.prisma.session.findUnique({
      where,
      include: {
        attendances: {
          include: { user: true }
        }
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// Create new session
export const createSession = async (req, res) => {
  try {
    const { date, description } = req.body;
    
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
    
    const session = await req.prisma.session.create({
      data: {
        date: new Date(date),
        description,
        clubId: clubId || null, // 멀티 테넌트 모드가 아니면 null
      }
    });
    
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

// Update session
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description } = req.body;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 세션이 해당 클럽에 속하는지 확인
    if (clubId) {
      const existingSession = await req.prisma.session.findUnique({
        where: { id },
        select: { clubId: true },
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (existingSession.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const session = await req.prisma.session.update({
      where: { id },
      data: {
        date: date ? new Date(date) : undefined,
        description
      }
    });
    
    res.json(session);
  } catch (error) {
    console.error('Error updating session:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(500).json({ error: 'Failed to update session' });
  }
};

// Delete session
export const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 세션이 해당 클럽에 속하는지 확인
    if (clubId) {
      const existingSession = await req.prisma.session.findUnique({
        where: { id },
        select: { clubId: true },
      });

      if (!existingSession) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (existingSession.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    await req.prisma.session.delete({
      where: { id }
    });
    
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

// Get today's session (한국 시간대 기준)
export const getTodaySession = async (req, res) => {
  try {
    // 한국 시간 기준 오늘의 범위
    const { start: today, end: tomorrow } = getKoreanTodayRange();
    const todayStart = getKoreanTodayStart();
    const dateString = getKoreanDateString();
    const clubId = getClubFilter(req);
    
    console.log(`[KST] Today range: ${today.toISOString()} ~ ${tomorrow.toISOString()}`);
    
    // where 조건 구성
    const where = {
      date: {
        gte: today,
        lt: tomorrow
      }
    };
    if (clubId) {
      where.clubId = clubId;
    }
    
    let session = await req.prisma.session.findFirst({
      where,
      include: {
        attendances: {
          include: { user: true }
        }
      }
    });
    
    // If no session exists for today, create one
    if (!session) {
      // 멀티 테넌트: clubId 자동 할당
      let sessionClubId = clubId;
      if (!sessionClubId) {
        // MVP 모드: 기본 클럽 ID 사용
        const clubInfo = getClubInfo(req);
        const defaultClubId = clubInfo.id;
        
        // 기본 클럽이 실제 Club 레코드인지 확인
        if (defaultClubId && defaultClubId !== "default-club") {
          const club = await req.prisma.club.findUnique({
            where: { id: defaultClubId },
          });
          if (club) {
            sessionClubId = club.id;
          }
        }
      }
      
      session = await req.prisma.session.create({
        data: {
          date: todayStart,
          description: `Morning Session - ${dateString}`,
          clubId: sessionClubId || null, // 멀티 테넌트 모드가 아니면 null
        },
        include: {
          attendances: {
            include: { user: true }
          }
        }
      });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching today session:', error);
    res.status(500).json({ error: 'Failed to fetch today session' });
  }
};

