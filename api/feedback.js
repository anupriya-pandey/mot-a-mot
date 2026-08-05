import { submitFeedback } from '../server/feedbackService.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await submitFeedback(req.body);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/feedback failed:', error);
    return res.status(500).json({
      message: "We couldn't send your feedback right now. Please try again.",
    });
  }
}
