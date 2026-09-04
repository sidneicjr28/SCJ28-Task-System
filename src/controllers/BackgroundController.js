const backgroundService = require('../services/BackgroundService');

class BackgroundController {
  getBackground(req, res) {
    try {
      const data = backgroundService.getBackground();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  uploadBackground(req, res) {
    try {
      const { image, filename } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }
      const data = backgroundService.uploadBackground({ image, filename });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  deleteBackground(req, res) {
    try {
      const data = backgroundService.deleteBackground();
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new BackgroundController();
