import { synthesizeSpeech } from '../server/ttsService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

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
}
