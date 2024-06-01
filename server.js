const express = require('express');
const { google } = require('googleapis');
const youtubeTranscript = require('youtube-transcript');
const youtubedl = require('youtube-dl-exec');
const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const client = new speech.SpeechClient();

app.get('/process', async (req, res) => {
  const videoUrl = req.query.url;

  try {
    const transcript = await getTranscriptOrDownload(videoUrl);
    const slidesUrl = await createSlidesFromTranscript(transcript);
    res.json({ slidesUrl });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function getYoutubeTranscript(url) {
  try {
    const videoId = extractVideoId(url);
    const transcript = await youtubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => item.text).join(' ');
  } catch (error) {
    console.error('Error fetching YouTube transcript:', error);
    return null;
  }
}

function extractVideoId(url) {
  const urlObj = new URL(url);
  return urlObj.searchParams.get('v');
}

async function downloadVideo(url) {
  try {
    const output = path.join(__dirname, 'video.mp4'); // Path to save the video
    await youtubedl(url, {
      output,
      format: 'mp4'
    });
    return output;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

async function transcribeVideo(videoPath) {
  const file = fs.readFileSync(videoPath);
  const audioBytes = file.toString('base64');

  const audio = {
    content: audioBytes,
  };
  const config = {
    encoding: 'LINEAR16',
    sampleRateHertz: 16000,
    languageCode: 'en-US',
  };
  const request = {
    audio: audio,
    config: config,
  };

  const [response] = await client.recognize(request);
  const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');
  return transcription;
}

async function createSlidesFromTranscript(transcript) {
  const auth = YOUR_AUTH; // Your OAuth2 client
  const slides = google.slides({ version: 'v1', auth });

  const presentation = await slides.presentations.create({
    requestBody: {
      title: 'Generated Slides'
    }
  });

  const presentationId = presentation.data.presentationId;

  const slidesData = transcript.split('\n').map(text => {
    return {
      createSlide: {
        slideLayoutReference: {
          predefinedLayout: 'TITLE_AND_BODY'
        }
      }
    };
  });

  await slides.presentations.batchUpdate({
    presentationId,
    requestBody: {
      requests: slidesData
    }
  });

  const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
  return slidesUrl;
}

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
