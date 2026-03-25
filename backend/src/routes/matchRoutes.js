// Routes for club-level match analysis and simulation. These endpoints
// implement the classic São Paulo-focused flow as well as generic match
// simulation. They persist sessions in the database for later replay.

const { v4: uuidv4 } = require('uuid');
const { runQuery, getAll } = require('../lib/sqliteDb');
const llmClient = require('../services/llmClient');
const hybridEngine = require('../services/hybridEngine');

module.exports = function registerMatchRoutes(app) {
  /**
   * Analyse a match given contextual information and return a tactical plan.
   * Expects body: { coach, opponent, squad, context }
   */
  app.post('/api/match/analyze', async (req, res) => {
    try {
      const { coach, opponent, squad, context } = req.body || {};
      if (!coach || !opponent) {
        return res.status(400).json({ error: 'coach and opponent are required' });
      }
      const prompt = buildAnalysisPrompt(coach, opponent, squad, context);
      const analysis = await llmClient.generate(prompt);
      return res.json({ analysis });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to analyse match' });
    }
  });

  /**
   * Simulate a match given a lineup and tactical instructions. Stores the
   * simulation result as a session for later replay. Expects body:
   * { lineup, instructions, coach, opponent }
   */
  app.post('/api/match/simulate', async (req, res) => {
    try {
      const { lineup, instructions, coach, opponent } = req.body || {};
      if (!lineup || !coach || !opponent) {
        return res.status(400).json({ error: 'lineup, coach and opponent are required' });
      }
      const sessionId = uuidv4();
      const result = await hybridEngine.simulateMatch({ lineup, instructions, coach, opponent });
      // Persist session to DB
      await runQuery(
        'INSERT INTO sessions (id, type, data) VALUES (?, ?, ?)',
        [sessionId, 'match', JSON.stringify(result)]
      );
      return res.json({ sessionId, result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to simulate match' });
    }
  });

  /**
   * Return list of previous match sessions for a user. For simplicity this
   * returns all stored sessions of type 'match'.
   */
  app.get('/api/match/history', async (req, res) => {
    try {
      const sessions = await getAll(
        'SELECT id, data, created_at FROM sessions WHERE type = ? ORDER BY created_at DESC',
        ['match']
      );
      const parsed = sessions.map((s) => ({ ...s, data: JSON.parse(s.data) }));
      return res.json(parsed);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  });
};

function buildAnalysisPrompt(coach, opponent, squad, context) {
  return `You are acting as coach ${coach}. Analyse the upcoming match against ${opponent}. Squad: ${JSON.stringify(
    squad
  )}. Context: ${context || 'N/A'}. Produce a tactical analysis.`;
}