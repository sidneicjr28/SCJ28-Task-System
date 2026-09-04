const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '../../settings.json');

const defaultSettings = {
  accentColor: '#ff3333'
};

class SettingsService {
  getSettings() {
    try {
      if (!fs.existsSync(settingsPath)) {
        this.saveSettings(defaultSettings);
        return defaultSettings;
      }
      const data = fs.readFileSync(settingsPath, 'utf8');
      return { ...defaultSettings, ...JSON.parse(data) };
    } catch (err) {
      console.error('Error reading settings.json:', err);
      return defaultSettings;
    }
  }

  saveSettings(settings) {
    try {
      const current = this.getSettings();
      const updated = { ...current, ...settings };
      fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), 'utf8');
      return updated;
    } catch (err) {
      console.error('Error writing settings.json:', err);
      throw err;
    }
  }
}

module.exports = new SettingsService();
