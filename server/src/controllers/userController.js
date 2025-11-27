// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await req.prisma.user.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
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
          orderBy: { date: 'desc' },
          take: 10
        },
        matchParticipants: {
          include: { match: true },
          orderBy: { match: { date: 'desc' } },
          take: 10
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
export const createUser = async (req, res) => {
  try {
    const { email, name, role, tennisLevel, goals, languagePref, profileMetadata } = req.body;
    
    console.log('Creating user with data:', { email, name, role, tennisLevel });
    
    const user = await req.prisma.user.create({
      data: {
        email,
        name,
        role: role || 'USER',
        tennisLevel: tennisLevel || 'NTRP_3_0',
        goals,
        languagePref: languagePref || 'ko',
        profileMetadata
      }
    });
    
    console.log('User created successfully:', user.id);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    console.error('Error details:', error.message);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    // 개발 환경에서 상세 에러 반환
    res.status(500).json({ 
      error: 'Failed to create user',
      details: error.message,
      code: error.code 
    });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, tennisLevel, goals, languagePref, profileMetadata } = req.body;
    
    const user = await req.prisma.user.update({
      where: { id },
      data: {
        email,
        name,
        tennisLevel,
        goals,
        languagePref,
        profileMetadata
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [attendanceCount, matchCount, winCount, user] = await Promise.all([
      req.prisma.attendance.count({
        where: { userId: id, status: 'ATTENDED' }
      }),
      req.prisma.matchParticipant.count({
        where: { userId: id }
      }),
      req.prisma.matchParticipant.count({
        where: { 
          userId: id,
          score: { gt: 0 }
        }
      }),
      req.prisma.user.findUnique({
        where: { id },
        select: { name: true, tennisLevel: true }
      })
    ]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      ...user,
      stats: {
        totalAttendance: attendanceCount,
        totalMatches: matchCount,
        wins: winCount,
        attendanceRate: attendanceCount > 0 ? Math.round((attendanceCount / matchCount) * 100) || 0 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

