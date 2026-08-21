import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { analyzeSentence, getHealthStatus, isConfigured } from './analyzeService.js';
import { submitFeedback } from './feedbackService.js';
import { importToolboxText } from './importService.js';
import { generatePracticeSession } from './practiceService.js';
import { gradePracticeExercise } from './practiceGradeService.js';
import { synthesizeSpeech, getTtsStatus } from './ttsService.js';
import {
  getProgressStorageStatus,
  getSavedProgress,
  saveProgress,
} from './progressService.js';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

app.post('/api/analyze', async (req, res) => {
  try {
    const result = await analyzeSentence({
      sentence: req.body?.sentence,
      clarification: req.body?.clarification,
      practicePrompt: req.body?.practicePrompt,
    });
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/analyze failed:', error);
    return res.status(500).json({
      message: "We couldn't check your sentence right now. Please try again.",
    });
  }
});

app.post('/api/import-toolbox', async (req, res) => {
  try {
    const result = await importToolboxText(req.body?.text);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/import-toolbox failed:', error);
    return res.status(500).json({
      message: "We couldn't analyze your import right now. Please try again.",
    });
  }
});

app.post('/api/practice-grade', async (req, res) => {
  try {
    const result = await gradePracticeExercise(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/practice-grade failed:', error);
    return res.status(500).json({
      message: "We couldn't grade your answer right now. Please try again.",
    });
  }
});

app.post('/api/practice-session', async (req, res) => {
  try {
    const result = await generatePracticeSession(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/practice-session failed:', error);
    return res.status(500).json({
      message: "We couldn't create your practice session right now. Please try again.",
    });
  }
});

app.post('/api/speak', async (req, res) => {
  try {
    const result = await synthesizeSpeech(req.body);

    if (result.status !== 200) {
      return res.status(result.status).json(result.body);
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(result.buffer);
  } catch (error) {
    console.error('POST /api/speak failed:', error);
    return res.status(500).json({
      message: "We couldn't generate speech right now. Please try again.",
    });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const result = await submitFeedback(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/feedback failed:', error);
    return res.status(500).json({
      message: "We couldn't send your feedback right now. Please try again.",
    });
  }
});

app.get('/api/progress', async (req, res) => {
  if (req.query?.status === '1') {
    return res.status(200).json(getProgressStorageStatus());
  }

  try {
    const result = await getSavedProgress(req.headers['x-mot-device-id']);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('GET /api/progress failed:', error);
    return res.status(500).json({
      message: "We couldn't sync your progress right now. Please try again.",
    });
  }
});

app.put('/api/progress', async (req, res) => {
  try {
    const result = await saveProgress(req.headers['x-mot-device-id'], req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('PUT /api/progress failed:', error);
    return res.status(500).json({
      message: "We couldn't sync your progress right now. Please try again.",
    });
  }
});

app.post('/api/progress', async (req, res) => {
  try {
    const result = await saveProgress(req.headers['x-mot-device-id'], req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/progress failed:', error);
    return res.status(500).json({
      message: "We couldn't sync your progress right now. Please try again.",
    });
  }
});

app.get('/', (_req, res) => {
  const health = getHealthStatus();
  res.json({
    name: 'Mot-à-Mot API',
    provider: health.provider,
    configured: health.configured,
    endpoints: {
      health: 'GET /api/health',
      analyze: 'POST /api/analyze',
      importToolbox: 'POST /api/import-toolbox',
      practiceSession: 'POST /api/practice-session',
      practiceGrade: 'POST /api/practice-grade',
      feedback: 'POST /api/feedback',
      progress: 'GET/PUT /api/progress',
      speak: 'POST /api/speak',
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ...getHealthStatus(),
    tts: getTtsStatus(),
  });
});

app.listen(port, () => {
  console.log(`Mot-à-Mot API running on http://localhost:${port}`);
  const health = getHealthStatus();
  console.log(`AI provider: ${health.provider ?? 'none configured'}`);
  console.log(`Configured: ${isConfigured()}`);
});
