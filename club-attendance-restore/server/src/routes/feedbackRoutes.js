import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';

const router = express.Router();

// GET /api/feedbacks - Get all feedbacks
router.get('/', feedbackController.getAllFeedbacks);

// GET /api/feedbacks/:id - Get feedback by ID
router.get('/:id', feedbackController.getFeedbackById);

// GET /api/feedbacks/user/:userId - Get feedbacks by user
router.get('/user/:userId', feedbackController.getFeedbacksByUser);

// POST /api/feedbacks - Create new feedback
router.post('/', feedbackController.createFeedback);

// PUT /api/feedbacks/:id - Update feedback
router.put('/:id', feedbackController.updateFeedback);

// DELETE /api/feedbacks/:id - Delete feedback
router.delete('/:id', feedbackController.deleteFeedback);

export default router;

