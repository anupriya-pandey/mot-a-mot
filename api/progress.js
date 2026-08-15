import {
  getProgressStorageStatus,
  getSavedProgress,
  saveProgress,
} from '../server/progressService.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method === 'GET' && req.query?.status === '1') {
    return res.status(200).json(getProgressStorageStatus());
  }

  const deviceId = req.headers['x-mot-device-id'];

  try {
    if (req.method === 'GET') {
      const result = await getSavedProgress(deviceId);
      return res.status(result.status).json(result.body);
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const result = await saveProgress(deviceId, req.body);
      return res.status(result.status).json(result.body);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error(`${req.method} /api/progress failed:`, error);
    return res.status(500).json({
      message: "We couldn't sync your progress right now. Please try again.",
    });
  }
}
