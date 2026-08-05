import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateQuestion, gradeAnswer } from './src/claude.js';
import { requireAuth } from './src/auth.js';

const app = express();

// Grading requests carry a base64 PNG snapshot, which can be sizeable.
app.use(express.json({ limit: '5mb' }));
app.use(cors());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// SPRINT3.md Ticket 3.2: proves the backend can identify the authenticated
// user making a request, via a verified Clerk session token.
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ userId: req.userId });
});

app.post('/api/generate-question', async (req, res) => {
  const { topic, tier } = req.body ?? {};
  if (typeof topic !== 'string' || !topic) {
    return res.status(400).json({ error: 'topic is required' });
  }
  try {
    const result = await generateQuestion(topic, tier);
    res.json(result);
  } catch (err) {
    console.error('[generate-question]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/grade-answer', async (req, res) => {
  const { imageBase64, question, answer } = req.body ?? {};
  if (typeof imageBase64 !== 'string' || !imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }
  if (typeof question !== 'string' || !question) {
    return res.status(400).json({ error: 'question is required' });
  }
  if (answer === undefined || answer === null) {
    return res.status(400).json({ error: 'answer is required' });
  }
  try {
    const result = await gradeAnswer(imageBase64, question, answer);
    res.json(result);
  } catch (err) {
    console.error('[grade-answer]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Jackson backend listening on port ${port}`);
});
