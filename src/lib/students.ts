// SPRINT3.md Tickets 3.3/3.4: client wrapper for the student-profile and
// known-topic-tier persistence endpoints. Separate from claude.ts since
// these aren't Claude calls and (unlike generate-question/grade-answer)
// require an authenticated Clerk session token.

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

async function authedFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
      authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Backend error ${response.status}: ${errorText}`);
  }
  return response.json() as Promise<T>;
}

export interface StudentProfile {
  id: number;
  name: string;
  created_at: string;
}

export async function listStudents(token: string): Promise<{ students: StudentProfile[] }> {
  return authedFetch('/api/students', token);
}

export async function createStudent(token: string, name: string): Promise<{ student: StudentProfile }> {
  return authedFetch('/api/students', token, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export interface KnownTopicTiersResponse {
  tiers: Record<string, number>;
  struggling: Record<string, boolean>;
  recentResults: Record<string, boolean[]>;
}

export async function getKnownTopicTiers(
  token: string,
  studentId: number
): Promise<KnownTopicTiersResponse> {
  return authedFetch(`/api/students/${studentId}/tiers`, token);
}

export async function saveKnownTopicTier(
  token: string,
  studentId: number,
  topic: string,
  data: { tier: number; struggling: boolean; recentResults: boolean[] }
): Promise<void> {
  await authedFetch(`/api/students/${studentId}/tiers/${encodeURIComponent(topic)}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
