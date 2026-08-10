import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generateQuestion, gradeAnswer, classifyTopic } from './src/claude.js';
import { requireAuth } from './src/auth.js';
import { findOrCreateParent, listStudents, createStudent, studentBelongsToParent } from './src/students.js';
import { getKnownTopicTiers, upsertKnownTopicTier } from './src/tiers.js';

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

// SPRINT4.md Ticket A: classifies free-text topic input into a known
// tracked topic, a dynamic (untracked) topic, or a decline.
app.post('/api/classify-topic', async (req, res) => {
  const { input } = req.body ?? {};
  if (typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'input is required' });
  }
  try {
    const result = await classifyTopic(input);
    res.json(result);
  } catch (err) {
    console.error('[classify-topic]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// SPRINT3.md Ticket 3.3: parent/student profiles. A "parent" row is
// created lazily on first use of the authenticated Clerk user, matching
// how requireAuth's req.userId (Clerk's `sub` claim) is the only identity
// info available -- there's no separate signup step for the parent record
// itself.
app.get('/api/students', requireAuth, async (req, res) => {
  try {
    const parentId = await findOrCreateParent(req.userId);
    const students = await listStudents(parentId);
    res.json({ students });
  } catch (err) {
    console.error('[students:list]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.post('/api/students', requireAuth, async (req, res) => {
  const { name } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }
  try {
    const parentId = await findOrCreateParent(req.userId);
    const student = await createStudent(parentId, name.trim());
    res.json({ student });
  } catch (err) {
    console.error('[students:create]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// SPRINT3.md Ticket 3.4: known-topic tier/streak state only -- dynamic
// topics never call these routes (App.tsx keeps dynamicTiers purely
// in-memory), so a dynamic topic can never end up as a row here.
app.get('/api/students/:studentId/tiers', requireAuth, async (req, res) => {
  const studentId = Number(req.params.studentId);
  if (!Number.isInteger(studentId)) {
    return res.status(400).json({ error: 'studentId must be an integer' });
  }
  try {
    if (!(await studentBelongsToParent(studentId, req.userId))) {
      return res.status(403).json({ error: 'Not your student' });
    }
    const data = await getKnownTopicTiers(studentId);
    res.json(data);
  } catch (err) {
    console.error('[tiers:get]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

app.put('/api/students/:studentId/tiers/:topic', requireAuth, async (req, res) => {
  const studentId = Number(req.params.studentId);
  const { tier, struggling, recentResults } = req.body ?? {};
  if (!Number.isInteger(studentId)) {
    return res.status(400).json({ error: 'studentId must be an integer' });
  }
  if (
    typeof tier !== 'number' ||
    typeof struggling !== 'boolean' ||
    !Array.isArray(recentResults) ||
    !recentResults.every((r) => typeof r === 'boolean')
  ) {
    return res.status(400).json({ error: 'tier (number), struggling (boolean), recentResults (boolean[]) are required' });
  }
  try {
    if (!(await studentBelongsToParent(studentId, req.userId))) {
      return res.status(403).json({ error: 'Not your student' });
    }
    await upsertKnownTopicTier(studentId, req.params.topic, { tier, struggling, recentResults });
    res.json({ ok: true });
  } catch (err) {
    console.error('[tiers:put]', err);
    res.status(502).json({ error: err instanceof Error ? err.message : String(err) });
  }
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
