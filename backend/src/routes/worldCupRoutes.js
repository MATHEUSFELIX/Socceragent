// API routes specific to the World Cup mode. Supports listing available
// World Cup tournaments, retrieving squads and simulating entire World Cup
// campaigns.

const { v4: uuidv4 } = require('uuid');
const { getAll, runQuery } = require('../lib/sqliteDb');
const worldCupService = require('../services/worldCupService');

module.exports = function registerWorldCupRoutes(app) {
  /**
   * Return a list of available World Cup years. These are loaded from the
   * database table `worldcups` when the server starts.
   */
  app.get('/api/worldcup/cups', async (req, res) => {
    try {
      const cups = await getAll('SELECT year FROM worldcups ORDER BY year ASC');
      return res.json(cups.map((c) => c.year));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch World Cups' });
    }
  });

  /**
   * Fetch the official Brazil squad for a given World Cup year. Query param
   * `year` is required.
   */
  app.get('/api/worldcup/squad', async (req, res) => {
    try {
      const year = parseInt(req.query.year, 10);
      if (!year) {
        return res.status(400).json({ error: 'year is required' });
      }
      const rows = await getAll('SELECT squad FROM worldcups WHERE year = ?', [year]);
      if (!rows.length) {
        return res.status(404).json({ error: 'World Cup not found' });
      }
      const squad = JSON.parse(rows[0].squad);
      return res.json({ year, squad });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch squad' });
    }
  });

  /**
   * Simulate an entire World Cup tournament with the given inputs. Expects
   * body: { year, selectedPlayers, coach }. Returns a session ID and
   * tournament result. Stores session in DB.
   */
  app.post('/api/worldcup/session', async (req, res) => {
    try {
      const { year, selectedPlayers, coach } = req.body || {};
      if (!year || !coach) {
        return res.status(400).json({ error: 'year and coach are required' });
      }
      const sessionId = uuidv4();
      const result = await worldCupService.simulateTournament({ year, selectedPlayers, coach });
      // Persist session into DB
      await runQuery(
        'INSERT INTO sessions (id, type, data) VALUES (?, ?, ?)',
        [sessionId, 'worldcup', JSON.stringify(result)]
      );
      return res.json({ sessionId, result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to simulate World Cup' });
    }
  });

  /**
   * Return history of World Cup sessions.
   */
  app.get('/api/worldcup/history', async (req, res) => {
    try {
      const sessions = await getAll(
        'SELECT id, data, created_at FROM sessions WHERE type = ? ORDER BY created_at DESC',
        ['worldcup']
      );
      const parsed = sessions.map((s) => ({ ...s, data: JSON.parse(s.data) }));
      return res.json(parsed);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  });
};