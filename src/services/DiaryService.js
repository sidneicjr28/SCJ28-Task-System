const path = require('path');
const fs = require('fs');
const diaryRepository = require('../repositories/DiaryRepository');

class DiaryService {
  getDiaries(filters) {
    return diaryRepository.findFiltered(filters);
  }

  getDiaryById(id) {
    return diaryRepository.findById(id);
  }

  createDiary(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Diary title is required');
    }
    return diaryRepository.create(data);
  }

  updateDiary(id, data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Diary title is required');
    }
    const existing = diaryRepository.findById(id);
    if (!existing) {
      throw new Error('Diary entry not found');
    }
    return diaryRepository.update(id, data);
  }

  deleteDiary(id) {
    const existing = diaryRepository.findById(id);
    if (!existing) {
      throw new Error('Diary entry not found');
    }
    diaryRepository.delete(id);
    return { success: true, message: 'Diary entry deleted' };
  }

  saveUploadedImage(base64Data, originalName = 'image.png') {
    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9+\-+]+);base64,(.+)$/);
    let extension = 'png';
    let buffer;

    if (matches && matches.length === 3) {
      extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      // Direct raw base64 string
      buffer = Buffer.from(base64Data, 'base64');
    }

    const fileName = `diary_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const uploadDir = path.join(__dirname, '../../uploads/diary-images');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    return {
      fileName,
      url: `/uploads/diary-images/${fileName}`
    };
  }
}

module.exports = new DiaryService();
