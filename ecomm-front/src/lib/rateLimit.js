const hits = new Map();

export const rateLimit = (key, { limit = 10, windowMs = 60_000 } = {}) => {
  const now = Date.now();
  const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    return { allowed: false };
  }

  timestamps.push(now);
  hits.set(key, timestamps);
  return { allowed: true };
};
