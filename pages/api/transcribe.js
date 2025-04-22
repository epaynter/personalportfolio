import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('❌ Form parse error:', err);
      return res.status(500).json({ error: 'Failed to parse form' });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      console.error('❌ No valid audio file found');
      return res.status(400).json({ error: 'No valid audio file received' });
    }

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.filepath), {
        filename: file.originalFilename || 'audio.webm',
        contentType: file.mimetype || 'audio/webm',
      });
      formData.append('model', 'whisper-1');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
          maxBodyLength: Infinity,
        }
      );

      console.log('✅ Whisper transcript:', response.data.text);
      return res.status(200).json({ transcript: response.data.text });
    } catch (error) {
      console.error('❌ Whisper upload failed:', error?.response?.data || error.message);
      return res.status(500).json({ error: error?.response?.data?.error?.message || error.message });
    }
  });
}
