/*
 * websocketHub manages WebSocket connections for live match sessions. Clients
 * connect with a `roomId` query parameter to join a specific room. Messages
 * sent by the backend to a room will be broadcast to all clients within
 * that room. This file provides a minimal implementation sufficient for
 * demonstrating live sessions and replays. In a production environment you
 * would add authentication, error handling and heartbeats.
 */

function setupWebSocketHub(wss) {
  const rooms = {};
  wss.on('connection', (ws, req) => {
    // Extract roomId from query string
    const urlParams = new URLSearchParams(req.url.replace(/^.*\?/, ''));
    const roomId = urlParams.get('roomId');
    if (!roomId) {
      ws.close(1008, 'roomId query parameter is required');
      return;
    }
    if (!rooms[roomId]) rooms[roomId] = new Set();
    rooms[roomId].add(ws);
    ws.on('close', () => {
      rooms[roomId].delete(ws);
      if (rooms[roomId].size === 0) delete rooms[roomId];
    });
    ws.on('message', (data) => {
      // Echo messages to other clients in the same room
      try {
        const msg = JSON.parse(data);
        broadcastToRoom(rooms, roomId, JSON.stringify(msg), ws);
      } catch (err) {
        // ignore invalid JSON
      }
    });
  });

  function broadcastToRoom(rooms, roomId, message, sender) {
    const clients = rooms[roomId] || new Set();
    for (const client of clients) {
      if (client.readyState === 1 && client !== sender) {
        client.send(message);
      }
    }
  }
}

module.exports = { setupWebSocketHub };