// Get all feedbacks
export const getAllFeedbacks = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    
    const feedbacks = await req.prisma.feedback.findMany({
      where,
      include: { user: true },
      orderBy: { date: 'desc' }
    });
    
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

// Get feedback by ID
export const getFeedbackById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const feedback = await req.prisma.feedback.findUnique({
      where: { id },
      include: { user: true }
    });
    
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

// Get feedbacks by user
export const getFeedbacksByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    
    const feedbacks = await req.prisma.feedback.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit ? parseInt(limit) : undefined
    });
    
    res.json(feedbacks);
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

// Create new feedback
export const createFeedback = async (req, res) => {
  try {
    const { userId, content } = req.body;
    
    const feedback = await req.prisma.feedback.create({
      data: {
        userId,
        content
      },
      include: { user: true }
    });
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
};

// Update feedback
export const updateFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    const feedback = await req.prisma.feedback.update({
      where: { id },
      data: { content },
      include: { user: true }
    });
    
    res.json(feedback);
  } catch (error) {
    console.error('Error updating feedback:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

// Delete feedback
export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    await req.prisma.feedback.delete({
      where: { id }
    });
    
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};

