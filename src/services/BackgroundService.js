const fs = require('fs');
const path = require('path');

const bkgDir = path.join(__dirname, '../../bkg-image');

class BackgroundService {
  constructor() {
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(bkgDir)) {
      fs.mkdirSync(bkgDir, { recursive: true });
    }
  }

  getBackground() {
    this.ensureDirectory();
    try {
      const files = fs.readdirSync(bkgDir);
      const imageFiles = files.filter(f => /\.(png|jpe?g|webp|gif|svg)$/i.test(f));
      if (imageFiles.length > 0) {
        return { imageUrl: `/bkg-image/${imageFiles[0]}` };
      }
      return { imageUrl: null };
    } catch (err) {
      console.error('Error reading bkg-image directory:', err);
      return { imageUrl: null };
    }
  }

  uploadBackground({ image, filename = 'background.png' }) {
    this.ensureDirectory();
    if (!image) {
      throw new Error('Image data is required');
    }

    // Clear existing background images
    const existingFiles = fs.readdirSync(bkgDir);
    existingFiles.forEach(f => {
      if (/\.(png|jpe?g|webp|gif|svg)$/i.test(f)) {
        fs.unlinkSync(path.join(bkgDir, f));
      }
    });

    // Sanitize filename and extract base64 data
    const extMatch = filename.match(/\.(png|jpe?g|webp|gif|svg)$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '.png';
    const targetFilename = `bg_${Date.now()}${ext}`;

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const targetPath = path.join(bkgDir, targetFilename);
    fs.writeFileSync(targetPath, buffer);

    return { imageUrl: `/bkg-image/${targetFilename}` };
  }

  deleteBackground() {
    this.ensureDirectory();
    try {
      const files = fs.readdirSync(bkgDir);
      files.forEach(f => {
        if (/\.(png|jpe?g|webp|gif|svg)$/i.test(f)) {
          fs.unlinkSync(path.join(bkgDir, f));
        }
      });
      return { success: true };
    } catch (err) {
      console.error('Error deleting background image:', err);
      throw err;
    }
  }
}

module.exports = new BackgroundService();
