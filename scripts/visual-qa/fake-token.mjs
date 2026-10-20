// Builds unsigned JWT-shaped tokens for the visual-QA personas.
//
// How the real app treats the token (see libs/frontend/auth + apps/.../main.ts):
//  - localStorage `auth_token` is sent as `Authorization: Bearer <token>` by AuthInterceptor.
//  - On boot the app calls GET /auth/me with it (-> mock-api answers from the persona behind the token).
//    If that fails with a network error it falls back to decoding the payload; it NEVER verifies the
//    signature and never reads `exp` client-side. A 401 would trigger the refresh flow, which is why we
//    also store a `refresh_token` that the mock `/auth/refresh` accepts.
//  - payload fields used: sub, email, displayName, roles[], team.
import { PERSONAS, userById } from './fixtures/index.mjs';

// Standard base64 (not url-safe): the app decodes the payload with atob(), which rejects '-' and '_'.
const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64');

/** Build `header.payload.signature` (signature is a dummy, never verified). */
export function buildToken(userId) {
  const u = userById(userId);
  if (!u) throw new Error(`fake-token: unknown user ${userId}`);
  const now = Math.floor(new Date('2026-10-21T17:00:00Z').getTime() / 1000);
  const payload = {
    sub: u.id,
    email: u.email,
    displayName: u.displayName,
    roles: u.roles,
    team: u.team,
    iat: now,
    exp: 4102444800, // 2100-01-01, far in the future
  };
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(payload)}.visual-qa-unsigned`;
}

export function personaNames() {
  return Object.keys(PERSONAS);
}

/** Returns { token, refreshToken, userId } for a persona, or nulls for `guest`. */
export function personaCredentials(persona) {
  const p = PERSONAS[persona];
  if (!p) throw new Error(`Unknown persona "${persona}". Known: ${personaNames().join(', ')}`);
  if (!p.token) return { token: null, refreshToken: null, userId: null };
  const userId = `user-${p.userKey}`;
  return { token: buildToken(userId), refreshToken: `visual-qa-refresh:${userId}`, userId };
}

/** Resolve a user id from `Authorization: Bearer ...` (or a refresh token). Returns null if invalid. */
export function userIdFromToken(token) {
  if (!token) return null;
  if (token.startsWith('visual-qa-refresh:')) return token.slice('visual-qa-refresh:'.length);
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Seed localStorage before any app script runs. Works with a Playwright BrowserContext or Page
 * (both have addInitScript). For `guest` it clears the keys instead.
 */
export async function installPersona(target, persona) {
  const { token, refreshToken } = personaCredentials(persona);
  await target.addInitScript(
    ({ token, refreshToken }) => {
      try {
        if (token) {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('refresh_token', refreshToken);
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      } catch {
        /* storage unavailable */
      }
    },
    { token, refreshToken },
  );
  return { token, refreshToken };
}

// CLI: node scripts/visual-qa/fake-token.mjs admin  -> prints the token (handy for curl / swagger)
if (process.argv[1]?.endsWith('fake-token.mjs')) {
  const persona = process.argv[2];
  if (persona) {
    const c = personaCredentials(persona);
    console.log(JSON.stringify(c, null, 2));
  }
}
