// Get all sessions
export const getAllSessions = async (req, res) => {
  try {
    const sessions = await req.prisma.session.findMany({
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
    const session = await req.prisma.session.findUnique({
      where: { id },
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
    
    const session = await req.prisma.session.create({
      data: {
        date: new Date(date),
        description
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

// Get today's session
export const getTodaySession = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let session = await req.prisma.session.findFirst({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        attendances: {
          include: { user: true }
        }
      }
    });
    
    // If no session exists for today, create one
    if (!session) {
      session = await req.prisma.session.create({
        data: {
          date: today,
          description: `Morning Session - ${today.toLocaleDateString()}`
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

