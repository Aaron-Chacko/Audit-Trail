import crypto from 'crypto';

function sortKeys(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = sortKeys(obj[key]);
  }
  return sorted;
}

export function calculateChecksum(data) {
  const normalized = sortKeys(data);
  const serialized = JSON.stringify(normalized !== undefined ? normalized : null);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function verifyChecksum(data, expectedChecksum) {
  if (!expectedChecksum || typeof expectedChecksum !== 'string') {
    return false;
  }
  const computed = calculateChecksum(data);
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(expectedChecksum));
}

export default {
  calculateChecksum,
  verifyChecksum,
};
