import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { analyzeSentence, getHealthStatus, isConfigured } from './analyzeService.js';
import { importToolboxText } from './importService.js';
import { generatePracticeSession } from './practiceService.js';

dotenv.config();

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

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

app.post('/api/practice-session', async (req, res) => {
  try {
    const result = await generatePracticeSession(req.body?.toolboxEntries);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/practice-session failed:', error);
    return res.status(500).json({
      message: "We couldn't create your practice session right now. Please try again.",
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
    },
  });
});

app.get('/api/health', (_req, res) => {
  res.json(getHealthStatus());
});

app.listen(port, () => {
  console.log(`Mot-à-Mot API running on http://localhost:${port}`);
  const health = getHealthStatus();
  console.log(`AI provider: ${health.provider ?? 'none configured'}`);
  console.log(`Configured: ${isConfigured()}`);
});
