import express from 'express';
import * as matchController from '../controllers/matchController.js';

const router = express.Router();

// GET /api/matches - Get all matches
router.get('/', matchController.getAllMatches);

// GET /api/matches/:id - Get match by ID
router.get('/:id', matchController.getMatchById);

// POST /api/matches/check-duplicate - Check for duplicate match
router.post('/check-duplicate', matchController.checkDuplicateMatch);

// POST /api/matches - Create new match
router.post('/', matchController.createMatch);

// PUT /api/matches/:id - Update match
router.put('/:id', matchController.updateMatch);

// DELETE /api/matches/:id - Delete match
router.delete('/:id', matchController.deleteMatch);

// POST /api/matches/:id/score - Update match score
router.post('/:id/score', matchController.updateScore);

// GET /api/matches/user/:userId - Get matches by user
router.get('/user/:userId', matchController.getMatchesByUser);

export default router;

