const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();
const path = require('path');
const morgan = require('morgan');

const { getGroq } = require('./groq.config');
const app = express();
const upload = multer({ dest: 'uploads/' }); // Temp storage for file uploads

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

//health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get summary from Groq
// Upload video and process it
app.post('/api/process-video', upload.single('video'), async (req, res) => {
  // console.log('object');
  const startTime = Date.now();
  const videoPath = req.file.path;

  try {
    // Step 1: Upload video to AssemblyAI
    const fileData = fs.readFileSync(videoPath);
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      fileData,
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/octet-stream',
        },
      }
    );
    const uploadUrl = uploadResponse.data.upload_url;

    // Step 2: Transcribe the video
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        audio_url: uploadUrl,
      },
      {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      }
    );
    const transcriptId = transcriptResponse.data.id;

    let transcription = '';
    while (true) {
      const statusResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        {
          headers: { authorization: ASSEMBLYAI_API_KEY },
        }
      );

      if (statusResponse.data.status === 'completed') {
        transcription = statusResponse.data.text;
        break;
      } else if (statusResponse.data.status === 'failed') {
        throw new Error('Transcription failed.');
      } else {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    const summaryResponse = await getGroq(transcription);
    const summary = summaryResponse.choices[0].message.content;

    // Calculate time taken
    const timeTaken = (Date.now() - startTime) / 1000; // in seconds

    // Cleanup uploaded file
    fs.unlinkSync(videoPath);

    // Send response
    res.json({ summary, timeTaken });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Something went wrong!' });
  }
});

const PORT = 4000;
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
