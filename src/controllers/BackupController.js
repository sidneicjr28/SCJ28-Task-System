const backupService = require('../services/BackupService');

class BackupController {
  async exportBackup(req, res) {
    try {
      const exportData = backupService.exportData();
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="scj28_backup_${new Date().toISOString().slice(0, 10)}.json"`);
      res.json(exportData);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async importBackup(req, res) {
    try {
      const result = backupService.importData(req.body);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new BackupController();
