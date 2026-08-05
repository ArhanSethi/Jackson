// SPRINT3.md Ticket 3.2: verifies the Clerk session token the client sends
// on Authorization: Bearer <token>, and identifies which Clerk user (the
// parent) is making the request.

import { verifyToken } from '@clerk/backend';

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    req.userId = payload.sub;
    next();
  } catch (err) {
    console.error('[auth]', err);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
