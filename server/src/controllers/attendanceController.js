import { getKoreanTodayRange, getKoreanTodayStart, getKoreanDateString } from '../utils/timezone.js';
import { buildClubWhere, getClubFilter, getClubInfo } from '../utils/clubInfo.js';

// Get all attendances
export const getAllAttendances = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const clubId = getClubFilter(req);
    
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    // 클럽 필터 적용
    if (clubId) {
      where.user = { clubId };
    }
    
    const attendances = await req.prisma.attendance.findMany({
      where,
      include: {
        user: true,
        session: true
      },
      orderBy: { date: 'desc' }
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
};

// Get attendances by session
export const getAttendancesBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 세션이 해당 클럽에 속하는지 확인
    if (clubId) {
      const session = await req.prisma.session.findUnique({
        where: { id: sessionId },
        select: { clubId: true },
      });

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      if (session.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const attendances = await req.prisma.attendance.findMany({
      where: { sessionId },
      include: { user: true },
      orderBy: { createdAt: 'asc' }
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
};

// Get attendances by user
export const getAttendancesByUser = async (req, res) => {
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
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const attendances = await req.prisma.attendance.findMany({
      where: { userId },
      include: { session: true },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });
    
    res.json(attendances);
  } catch (error) {
    console.error('Error fetching attendances:', error);
    res.status(500).json({ error: 'Failed to fetch attendances' });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { userId, sessionId, status } = req.body;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 사용자와 세션이 해당 클럽에 속하는지 확인
    if (clubId) {
      const [user, session] = await Promise.all([
        req.prisma.user.findUnique({
          where: { id: userId },
          select: { clubId: true },
        }),
        req.prisma.session.findUnique({
          where: { id: sessionId },
          select: { clubId: true },
        }),
      ]);

      if (!user || !session) {
        return res.status(404).json({ error: 'User or session not found' });
      }

      if (user.clubId !== clubId || session.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const attendance = await req.prisma.attendance.upsert({
      where: {
        userId_sessionId: { userId, sessionId }
      },
      update: { status },
      create: {
        userId,
        sessionId,
        status: status || 'ATTENDED'
      },
      include: { user: true, session: true }
    });
    
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

// Update attendance
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 출석이 해당 클럽에 속하는지 확인
    if (clubId) {
      const attendance = await req.prisma.attendance.findUnique({
        where: { id },
        include: {
          user: { select: { clubId: true } },
        },
      });

      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }

      if (attendance.user.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    const updatedAttendance = await req.prisma.attendance.update({
      where: { id },
      data: { status },
      include: { user: true, session: true }
    });
    
    res.json(updatedAttendance);
  } catch (error) {
    console.error('Error updating attendance:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Attendance not found' });
    }
    res.status(500).json({ error: 'Failed to update attendance' });
  }
};

// Delete attendance
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 출석이 해당 클럽에 속하는지 확인
    if (clubId) {
      const attendance = await req.prisma.attendance.findUnique({
        where: { id },
        include: {
          user: { select: { clubId: true } },
        },
      });

      if (!attendance) {
        return res.status(404).json({ error: 'Attendance not found' });
      }

      if (attendance.user.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    await req.prisma.attendance.delete({
      where: { id }
    });
    
    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendance:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Attendance not found' });
    }
    res.status(500).json({ error: 'Failed to delete attendance' });
  }
};

// Quick check-in for current session (한국 시간대 기준)
export const quickCheckIn = async (req, res) => {
  try {
    const { userId } = req.body;
    const clubId = getClubFilter(req);
    
    // 멀티 테넌트: 사용자가 해당 클럽에 속하는지 확인
    if (clubId) {
      const user = await req.prisma.user.findUnique({
        where: { id: userId },
        select: { clubId: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.clubId !== clubId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    
    // 한국 시간 기준 오늘의 범위
    const { start: today, end: tomorrow } = getKoreanTodayRange();
    const todayStart = getKoreanTodayStart();
    const dateString = getKoreanDateString();
    
    console.log(`[KST] Quick check-in for today: ${today.toISOString()} ~ ${tomorrow.toISOString()}`);
    
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
      where
    });
    
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
        }
      });
    }
    
    // Mark attendance
    const attendance = await req.prisma.attendance.upsert({
      where: {
        userId_sessionId: { userId, sessionId: session.id }
      },
      update: { status: 'ATTENDED' },
      create: {
        userId,
        sessionId: session.id,
        status: 'ATTENDED'
      },
      include: { user: true, session: true }
    });
    
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Error checking in:', error);
    res.status(500).json({ error: 'Failed to check in' });
  }
};

