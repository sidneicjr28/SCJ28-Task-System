const settingsService = require('../services/SettingsService');

class SettingsController {
  async getSettings(req, res) {
    try {
      const settings = settingsService.getSettings();
      res.json(settings);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateSettings(req, res) {
    try {
      const { accentColor } = req.body;
      if (!accentColor || !/^#([0-9A-F]{3}){1,2}$/i.test(accentColor)) {
        return res.status(400).json({ error: 'Valid hex accentColor is required' });
      }
      const updated = settingsService.saveSettings({ accentColor });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new SettingsController();
