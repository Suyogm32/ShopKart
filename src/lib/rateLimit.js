const requestLog = new Map();

/**
 * Simple in-memory sliding-window rate limiter, keyed by IP.
 *
 * Good enough for a single-instance deployment. If this ever runs as
 * multiple instances behind a load balancer, this needs to move to a shared
 * store (e.g. Redis/Upstash) — each instance would otherwise track its own
 * separate counts, making the limit effectively N times looser than intended.
 */
export function rateLimit(identifier, { limit = 5, windowMs = 60_000 } = {}) {
  const now = Date.now();
  const recent = (requestLog.get(identifier) || []).filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (recent.length >= limit) {
    return { allowed: false, retryAfterMs: windowMs - (now - recent[0]) };
  }

  recent.push(now);
  requestLog.set(identifier, recent);
  return { allowed: true };
}
