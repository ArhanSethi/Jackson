// SPRINT3.md Ticket 3.1: the Claude API key and all Anthropic calls now live
// here, server-side only. The client no longer holds an Anthropic key at
// all — it calls this backend instead (see index.js).

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not set');
  }
  return key;
}

async function callClaude(content) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': getApiKey(),
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
      // No 'anthropic-dangerous-direct-browser-access' header here: this is
      // a server-to-server call now, not a browser call, so that opt-in
      // (and the CORS restriction it bypasses) no longer applies.
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('Claude API response had no text content');
  }
  return text;
}

function parseJsonResponse(text) {
  // The prompts ask for raw JSON, but Claude occasionally still wraps it in
  // markdown fences or prepends explanatory prose. Extracting the {...}
  // slice handles both instead of assuming the whole string is valid JSON.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Claude response did not contain a JSON object: ${text}`);
  }
  return JSON.parse(text.slice(start, end + 1));
}

// SPRINT.md Ticket 1.2 / SPRINT2.md Ticket 3.1/3.2 tier ranges, ported
// verbatim from the client's src/lib/claude.ts.
const TIER_DESCRIPTIONS = {
  addition: {
    1: 'two single-digit numbers (1-9) whose sum is under 10',
    2: 'a two-digit number plus a one- or two-digit number, with no carrying/regrouping required',
    3: 'two two-digit numbers that require carrying/regrouping to add',
  },
  subtraction: {
    1: 'two single-digit numbers (1-9), with a non-negative result',
    2: 'a two-digit number minus a one- or two-digit number, with no borrowing required',
    3: 'two two-digit numbers that require borrowing/regrouping to subtract',
  },
  multiplication: {
    1: 'two small single-digit numbers (1-5)',
    2: 'a single-digit number (1-9) times a number up to 12',
    3: 'two two-digit numbers, or a two-digit number times a single-digit number, with a larger product',
  },
  division: {
    1: 'a small exact division with a dividend under 20 and a divisor from 1-5',
    2: 'an exact division with a dividend up to 100 and a divisor up to 10',
    3: 'an exact division with a two-digit quotient, dividend up to 200',
  },
  fractions: {
    1: 'adding or subtracting two fractions that already share the same denominator (e.g. 1/4 + 2/4), no simplifying needed',
    2: 'adding or subtracting two fractions with different denominators that have an easy common multiple (e.g. 1/2 + 1/4), no simplifying needed',
    3: 'adding or subtracting two fractions with different denominators, chosen so the raw sum is NOT already in lowest terms — the student must simplify it (e.g. 1/6 + 1/3 = 3/6, which simplifies to 1/2; do not pick pairs whose sum is already reduced)',
  },
  'word problems': {
    1: 'a single-step addition or subtraction word problem using small numbers (under 20)',
    2: 'a single-step addition, subtraction, multiplication, or division word problem using larger numbers (up to 100)',
    3: 'a two-step word problem (e.g. add then subtract, or multiply then add) using numbers appropriate for the operations involved',
  },
};

function getTierDescription(topic, tier) {
  const clampedTier = Math.min(3, Math.max(1, Math.round(tier)));
  const topicTiers = TIER_DESCRIPTIONS[topic.toLowerCase()];
  return topicTiers?.[clampedTier] ?? `tier ${clampedTier} difficulty`;
}

function buildQuestionPrompt(topic, tier) {
  const difficulty = getTierDescription(topic, tier);

  if (topic.toLowerCase() === 'fractions') {
    return `Generate one fractions question appropriate for a K-8 student that asks them to add or subtract two fractions. Difficulty: ${difficulty}. Provide the question in slash notation (e.g. "1/4 + 2/4"), a natural spoken version using words instead of symbols (e.g. "What is one fourth plus two fourths?"), and the answer as a fraction string in lowest terms, like "3/4" — never a decimal like "0.75". Return ONLY valid JSON, no markdown: {"question": "1/4 + 2/4", "spoken": "What is one fourth plus two fourths?", "answer": "3/4"}`;
  }

  if (topic.toLowerCase() === 'word problems') {
    return `Generate one short word-problem question appropriate for a K-8 student. Difficulty: ${difficulty}. Phrase it as a brief story-style sentence a student would read or hear (e.g. "Sam has 4 apples and buys 3 more. How many apples does Sam have now?"). The answer must be a single plain number — not a fraction, not a decimal, not a sentence. Return ONLY valid JSON, no markdown: {"question": "Sam has 4 apples and buys 3 more. How many apples does Sam have now?", "answer": 7}`;
  }

  return `Generate one simple ${topic} question appropriate for a K-8 student. Difficulty: ${difficulty}. Return ONLY valid JSON, no markdown: {"question": "4 + 4", "answer": 8}`;
}

export async function generateQuestion(topic, tier = 1) {
  const prompt = buildQuestionPrompt(topic, tier);
  const text = await callClaude(prompt);
  return parseJsonResponse(text);
}

// SPRINT4.md Ticket A: the known internal topic set Jackson already has
// tier/tracking infrastructure for. Must match TIER_DESCRIPTIONS above and
// the TOPICS array in App.tsx exactly, including "Word Problems" using a
// space (not the "word_problems" shorthand used in planning docs).
export const KNOWN_TOPICS = [
  'Addition',
  'Subtraction',
  'Multiplication',
  'Division',
  'Fractions',
  'Word Problems',
];

function buildClassifyTopicPrompt(input) {
  return `You are routing a K-8 student's free-text request for what math topic they want to practice, inside a math practice app.

The app already has tracked difficulty progression for exactly these known topics: ${KNOWN_TOPICS.join(', ')}.

Given the student's input below, decide exactly one of three outcomes:
1. "known" — the input clearly refers to one of the known topics above, allowing for natural phrasing (e.g. "long division" means Division, "adding fractions" means Fractions, "times tables" means Multiplication). Set "topic" to the exact known topic name from the list above, spelled exactly as given.
2. "dynamic" — the input is a plausible K-8 academic math topic but does NOT match any known topic (e.g. "telling time", "area of a rectangle", "counting money"). Set "topic" to a short, clean, properly-capitalized label for it.
3. "decline" — the input is not a plausible K-8 academic topic at all (inappropriate, nonsensical, unsafe, off-topic, or not academic). Set "topic" to null.

Student input: "${input}"

Return ONLY valid JSON, no markdown: {"classification": "known"|"dynamic"|"decline", "topic": "<exact known topic name>"|"<clean label>"|null}`;
}

export async function classifyTopic(input) {
  const prompt = buildClassifyTopicPrompt(input);
  const text = await callClaude(prompt);
  const result = parseJsonResponse(text);

  if (!['known', 'dynamic', 'decline'].includes(result.classification)) {
    throw new Error(`Unexpected classification from Claude: ${JSON.stringify(result)}`);
  }
  if (result.classification === 'known' && !KNOWN_TOPICS.includes(result.topic)) {
    // Claude picked "known" but didn't return one of our exact strings —
    // treat as dynamic with whatever label it gave rather than silently
    // routing to the wrong tracked topic.
    return { classification: 'dynamic', topic: result.topic };
  }
  return result;
}

export async function gradeAnswer(imageBase64, question, answer) {
  const content = [
    {
      type: 'image',
      source: { type: 'base64', media_type: 'image/png', data: imageBase64 },
    },
    {
      type: 'text',
      text: `A student was asked: ${question}\nThe correct answer is ${answer}.\nRead what they wrote and determine if it matches. Respond ONLY with JSON: {"written": "<value>", "correct": true|false, "confidence": "high"|"low"}`,
    },
  ];
  const text = await callClaude(content);
  return parseJsonResponse(text);
}
