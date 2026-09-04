const diaryService = require('../services/DiaryService');

class DiaryController {
  async getDiaries(req, res) {
    try {
      const diaries = diaryService.getDiaries(req.query);
      res.json(diaries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getDiaryById(req, res) {
    try {
      const diary = diaryService.getDiaryById(req.params.id);
      if (!diary) {
        return res.status(404).json({ error: 'Diary entry not found' });
      }
      res.json(diary);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async createDiary(req, res) {
    try {
      const { title } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }
      const diary = diaryService.createDiary(req.body);
      res.status(201).json(diary);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateDiary(req, res) {
    try {
      const { id } = req.params;
      const diary = diaryService.updateDiary(id, req.body);
      res.json(diary);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteDiary(req, res) {
    try {
      const { id } = req.params;
      const result = diaryService.deleteDiary(id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async uploadImage(req, res) {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }
      const result = diaryService.saveUploadedImage(image, name);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

module.exports = new DiaryController();
