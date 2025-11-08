// Simple Server-Sent Events (SSE) broadcaster
// Keeps a list of connected response objects and broadcasts JSON events

const clients = new Set();

function addClient(res) {
  clients.add(res);
}

function removeClient(res) {
  clients.delete(res);
}

function broadcast(type, data) {
  const payload = `data: ${JSON.stringify({ type, data })}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (_e) {
      // Drop broken client
      clients.delete(res);
    }
  }
}

module.exports = { addClient, removeClient, broadcast };
