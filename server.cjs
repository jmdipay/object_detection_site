// server.cjs  (CommonJS – no import)
const express = require('express');
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');

const app = express();

// serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// proxy to Python FastAPI
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      console.error('INFERENCE ERROR: no_image');
      return res.status(400).json({ error: 'no_image' });
    }

    const form = new FormData();
    form.append('image', req.file.buffer, {
      filename: 'frame.jpg',
      contentType: req.file.mimetype || 'image/jpeg'
    });

    const r = await axios.post('http://127.0.0.1:8000/detect', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 120000
    });

    res.json(r.data);
  } catch (e) {
    const detail = e?.response?.data || e?.message || 'unknown';
    console.error('INFERENCE ERROR:', detail);
    res.status(500).json({ error: detail });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
