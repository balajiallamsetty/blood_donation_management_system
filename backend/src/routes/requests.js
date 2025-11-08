const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const { requireRole, requireOwnerOrRole } = require('../middleware/roles');
const Request = require('../models/Request');
const {
  createRequest,
  getRequests,
  getRequestById,
  patchStatus,
  fulfill
} = require('../controllers/requestController');
const { addClient, removeClient } = require('../utils/sse');

router.post('/', verifyToken, createRequest);
router.get('/', getRequests);

// SSE stream for real-time request events — must be declared BEFORE parameterized routes
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // Send an initial event to confirm connection
  res.write(`data: ${JSON.stringify({ type: 'connected', data: { ts: Date.now() } })}\n\n`);

  addClient(res);

  // Heartbeat to keep connections alive on some proxies
  const ping = setInterval(() => {
    try { res.write(': ping\n\n'); } catch (_e) {}
  }, 30000);

  req.on('close', () => {
    clearInterval(ping);
    removeClient(res);
    try { res.end(); } catch (_e) {}
  });
});

router.get('/:id', getRequestById);
// Only donors can mark a request as fulfilled via status change
// Donors can fulfill; request owner can also update their own request status
router.patch(
  '/:id/status',
  verifyToken,
  requireOwnerOrRole(async (req) => {
    const r = await Request.findById(req.params.id).select('requester');
    return r ? r.requester : null;
  }, ['donor']),
  patchStatus
);
router.post('/:id/fulfill', verifyToken, requireRole(['admin', 'hospital']), fulfill);

module.exports = router;
