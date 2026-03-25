// Main entry point for the backend. Sets up HTTP + WebSocket server, loads
// environment configuration, initialises the database and registers all routes.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

// Import helpers and routes
const { initDb } = require('./lib/sqliteDb');
const registerMatchRoutes = require('./routes/matchRoutes');
const registerWorldCupRoutes = require('./routes/worldCupRoutes');
const { setupWebSocketHub } = require('./lib/websocketHub');

async function startServer() {
  // Initialise the SQLite database. If the file does not exist it will be created
  // and initial tables will be created automatically. See lib/sqliteDb.js
  await initDb();

  const app = express();
  const port = process.env.PORT || 3001;

  // Basic middlewares
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  // Register HTTP API routes
  registerMatchRoutes(app);
  registerWorldCupRoutes(app);

  // Create HTTP server and wrap with WebSocket server for live sessions
  const server = http.createServer(app);
  const wss = new WebSocket.Server({ server });

  // Setup WebSocket hub to manage sessions/rooms
  setupWebSocketHub(wss);

  server.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});