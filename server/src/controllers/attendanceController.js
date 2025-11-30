import { getKoreanTodayRange, getKoreanTodayStart, getKoreanDateString } from '../utils/timezone.js';

// Get all attendances
export const getAllAttendances = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
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
    
    const attendance = await req.prisma.attendance.update({
      where: { id },
      data: { status },
      include: { user: true, session: true }
    });
    
    res.json(attendance);
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
    
    // 한국 시간 기준 오늘의 범위
    const { start: today, end: tomorrow } = getKoreanTodayRange();
    const todayStart = getKoreanTodayStart();
    const dateString = getKoreanDateString();
    
    console.log(`[KST] Quick check-in for today: ${today.toISOString()} ~ ${tomorrow.toISOString()}`);
    
    let session = await req.prisma.session.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    if (!session) {
      session = await req.prisma.session.create({
        data: {
          date: todayStart,
          description: `Morning Session - ${dateString}`
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

