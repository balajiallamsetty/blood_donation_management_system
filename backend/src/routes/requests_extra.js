const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { createRequest, getRequests, getRequestById, patchStatus, fulfill } = require('../controllers/requestController');

router.post('/', verifyToken, createRequest);
router.get('/', getRequests);
router.get('/:id', getRequestById);
router.patch('/:id/status', verifyToken, requireRole(['admin', 'hospital']), patchStatus);
router.post('/:id/fulfill', verifyToken, requireRole(['admin', 'hospital']), fulfill);

module.exports = router;
