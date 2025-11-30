import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', userController.getAllUsers);

// GET /api/users/with-stats - Get all users with stats (admin)
router.get('/with-stats', userController.getAllUsersWithStats);

// GET /api/users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// POST /api/users - Create new user
router.post('/', userController.createUser);

// PUT /api/users/:id - Update user
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

// POST /api/users/delete-multiple - Delete multiple users (admin)
router.post('/delete-multiple', userController.deleteMultipleUsers);

// GET /api/users/:id/stats - Get user statistics
router.get('/:id/stats', userController.getUserStats);

// GET /api/users/:id/versus/:opponentId - Get head-to-head record
router.get('/:id/versus/:opponentId', userController.getHeadToHead);

export default router;

