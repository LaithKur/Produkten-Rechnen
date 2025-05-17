// server.js
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

const CLOUD_NAME = 'dwalfzmb0';
const API_KEY = '744862298811332';
const API_SECRET = 'xirvvOHfEWWj1JKm0gtUoKnp9WI';

app.use(express.static('public'));

// دالة توليد التوقيع
function generateSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const str = sortedKeys.map(key => `${key}=${params[key]}`).join('&') + apiSecret;
  return crypto.createHash('sha1').update(str).digest('hex');
}

app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'Produkten';

    // إنشاء باراميترز التوقيع
    const paramsToSign = { folder, timestamp };

    // توليد التوقيع
    const signature = generateSignature(paramsToSign, API_SECRET);

    // إنشاء form-data
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    formData.append('api_key', API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    // إرسال طلب رفع الصورة إلى Cloudinary
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData,
      { headers: formData.getHeaders() }
    );

    res.json({ imageUrl: response.data.secure_url });
  } catch (err) {
    console.error('Error uploading image:', err.message);
    res.status(500).json({ message: 'حدث خطأ أثناء رفع الصورة' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
