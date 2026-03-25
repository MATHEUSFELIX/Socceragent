/*
 * Service for managing live match sessions. Provides functions to create
 * sessions, append events and retrieve current state. Sessions are stored
 * in memory and persisted via the database. For V8 we introduce a simple
 * interface; later versions could move storage to Postgres or Redis and
 * support multi-user coordination.
 */

const { v4: uuidv4 } = require('uuid');
const { runQuery, getRow } = require('../lib/sqliteDb');

// In-memory map of active sessions: { id: { sessionId, type, state, events } }
const activeSessions = {};

function createSession(type = 'match', initialState = {}) {
  const sessionId = uuidv4();
  activeSessions[sessionId] = {
    sessionId,
    type,
    state: initialState,
    events: [],
  };
  return activeSessions[sessionId];
}

function getSession(sessionId) {
  return activeSessions[sessionId];
}

function appendEvent(sessionId, event) {
  const session = activeSessions[sessionId];
  if (!session) return;
  session.events.push(event);
}

async function persistSession(sessionId) {
  const session = activeSessions[sessionId];
  if (!session) return;
  await runQuery(
    'INSERT INTO sessions (id, type, data) VALUES (?, ?, ?)',
    [session.sessionId, session.type, JSON.stringify(session)]
  );
  // Optionally store events in events table
  for (const ev of session.events) {
    await runQuery(
      'INSERT INTO events (session_id, timestamp, event_type, payload) VALUES (?, ?, ?, ?)',
      [session.sessionId, Date.now(), ev.type, JSON.stringify(ev)]
    );
  }
  delete activeSessions[sessionId];
}

module.exports = {
  createSession,
  getSession,
  appendEvent,
  persistSession,
  activeSessions,
};