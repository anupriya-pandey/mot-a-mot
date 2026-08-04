import { gradePracticeExercise } from '../server/practiceGradeService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const result = await gradePracticeExercise(req.body);
  return res.status(result.status).json(result.body);
}
