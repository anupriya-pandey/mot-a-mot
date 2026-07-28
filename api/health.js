import { getHealthStatus } from '../server/analyzeService.js';

export default function handler(_req, res) {
  return res.status(200).json(getHealthStatus());
}
