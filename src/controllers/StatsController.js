const statsService = require('../services/StatsService');

class StatsController {
  async getStats(req, res) {
    try {
      const stats = statsService.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new StatsController();
