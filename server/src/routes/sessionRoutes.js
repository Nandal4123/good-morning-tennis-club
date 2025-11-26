import express from 'express';
import * as sessionController from '../controllers/sessionController.js';

const router = express.Router();

// GET /api/sessions - Get all sessions
router.get('/', sessionController.getAllSessions);

// GET /api/sessions/:id - Get session by ID
router.get('/:id', sessionController.getSessionById);

// POST /api/sessions - Create new session
router.post('/', sessionController.createSession);

// PUT /api/sessions/:id - Update session
router.put('/:id', sessionController.updateSession);

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', sessionController.deleteSession);

// GET /api/sessions/today - Get today's session
router.get('/today/current', sessionController.getTodaySession);

export default router;

