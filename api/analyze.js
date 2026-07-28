import { analyzeSentence } from '../server/analyzeService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const result = await analyzeSentence({
    sentence: req.body?.sentence,
    clarification: req.body?.clarification,
  });
  return res.status(result.status).json(result.body);
}
