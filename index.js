import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'data', 'db.json');

// Получить все данные
app.get('/api/subjects', (req, res) => {
  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка чтения базы данных' });
    }
    res.json(JSON.parse(data));
  });
});

// Добавить параграф (только для администратора)
app.post('/api/subjects/:subjectKey/paragraphs', (req, res) => {
  const { subjectKey } = req.params;
  const { title, time, text } = req.body;

  const adminToken = req.headers['x-admin-token'];
  const SECRET_KEY = 'stinery123'; // Твой секретный пароль

  if (adminToken !== SECRET_KEY) {
    return res.status(403).json({ error: 'Доступ запрещен. Неверный пароль администратора.' });
  }

  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка чтения базы данных' });
    }

    const db = JSON.parse(data);

    if (!db[subjectKey]) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }

    const newParagraph = {
      id: Date.now(),
      title,
      time: time || '3 мин',
      text
    };

    db[subjectKey].paragraphs.push(newParagraph);

    fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка сохранения в базу данных' });
      }
      res.status(201).json(newParagraph);
    });
  });
});

// Удалить параграф (только для администратора)
app.delete('/api/subjects/:subjectKey/paragraphs/:id', (req, res) => {
  const { subjectKey, id } = req.params;

  const adminToken = req.headers['x-admin-token'];
  const SECRET_KEY = 'stinery123'; // Твой секретный пароль

  if (adminToken !== SECRET_KEY) {
    return res.status(403).json({ error: 'Доступ запрещен. Неверный пароль администратора.' });
  }

  fs.readFile(dbPath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка чтения базы данных' });
    }

    const db = JSON.parse(data);

    if (!db[subjectKey]) {
      return res.status(404).json({ error: 'Предмет не найден' });
    }

    const initialLength = db[subjectKey].paragraphs.length;
    db[subjectKey].paragraphs = db[subjectKey].paragraphs.filter(p => p.id !== Number(id));

    if (db[subjectKey].paragraphs.length === initialLength) {
      return res.status(404).json({ error: 'Параграф не найден' });
    }

    fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8', (err) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка сохранения в базу данных' });
      }
      res.json({ success: true });
    });
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});