// SPRINT3.md Ticket 3.1: the client no longer talks to Anthropic directly or
// holds an Anthropic API key. Question generation and grading are proxied
// through our own backend (see server/), which holds the key server-side.

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function callBackend<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

export interface GeneratedQuestion {
  question: string;
  // Widened for SPRINT2.md Ticket 3.1: fraction answers are strings like
  // "3/4" (a student would never hand-write "0.75"), not numbers.
  answer: number | string;
  // SPRINT2.md Ticket 3.1: natural-language phrasing for speak(), e.g. "What
  // is one fourth plus two fourths?" instead of reading "1/4 + 2/4" literally.
  // Falls back to `question` when absent (all the original topics).
  spoken?: string;
}

export async function generateQuestion(
  topic: string,
  tier: number = 1
): Promise<GeneratedQuestion> {
  return callBackend<GeneratedQuestion>('/api/generate-question', { topic, tier });
}

export interface GradingResult {
  written: string;
  correct: boolean;
  confidence: 'high' | 'low';
}

export async function gradeAnswer(
  imageBase64: string,
  question: string,
  answer: number | string
): Promise<GradingResult> {
  return callBackend<GradingResult>('/api/grade-answer', { imageBase64, question, answer });
}

// SPRINT3.md Ticket 3.2: hits the backend's auth-protected /api/me with the
// signed-in user's Clerk session token, so callers can confirm the backend
// actually identifies who's making the request (not just that the route
// exists).
export async function verifyBackendAuth(token: string): Promise<{ userId: string }> {
  const response = await fetch(`${BACKEND_URL}/api/me`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorText}`);
  }
  return response.json();
}
