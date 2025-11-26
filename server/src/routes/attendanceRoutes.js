import express from 'express';
import * as attendanceController from '../controllers/attendanceController.js';

const router = express.Router();

// GET /api/attendances - Get all attendances
router.get('/', attendanceController.getAllAttendances);

// GET /api/attendances/session/:sessionId - Get attendances by session
router.get('/session/:sessionId', attendanceController.getAttendancesBySession);

// GET /api/attendances/user/:userId - Get attendances by user
router.get('/user/:userId', attendanceController.getAttendancesByUser);

// POST /api/attendances - Mark attendance
router.post('/', attendanceController.markAttendance);

// PUT /api/attendances/:id - Update attendance
router.put('/:id', attendanceController.updateAttendance);

// DELETE /api/attendances/:id - Delete attendance
router.delete('/:id', attendanceController.deleteAttendance);

// POST /api/attendances/checkin - Quick check-in for current session
router.post('/checkin', attendanceController.quickCheckIn);

export default router;

