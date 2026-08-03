import { generatePracticeSession } from '../server/practiceService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await generatePracticeSession(req.body?.toolboxEntries);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/practice-session failed:', error);
    return res.status(500).json({
      message: "We couldn't create your practice session right now. Please try again.",
    });
  }
}
