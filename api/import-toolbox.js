import { importToolboxText } from '../server/importService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await importToolboxText(req.body?.text);
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error('POST /api/import-toolbox failed:', error);
    return res.status(500).json({
      message: "We couldn't analyze your import right now. Please try again.",
    });
  }
}
