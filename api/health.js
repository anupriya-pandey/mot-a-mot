import { getHealthStatus } from '../server/analyzeService.js';
import { getTtsStatus } from '../server/ttsService.js';

export default function handler(_req, res) {
  return res.status(200).json({
    ...getHealthStatus(),
    tts: getTtsStatus(),
  });
}
