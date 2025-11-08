const express = require('express');
const router = express.Router({ mergeParams: true });
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { runMatches, getMatches } = require('../controllers/matchesController');

router.post('/:id/match', verifyToken, requireRole('admin'), runMatches);
router.get('/:id/matches', getMatches);

module.exports = router;
