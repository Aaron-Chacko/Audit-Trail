const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function sanitizePayload(input, { trimStrings = true } = {}) {
  if (input === null || input === undefined) {
    return {};
  }

  if (typeof input !== 'object') {
    if (typeof input === 'string' && trimStrings) {
      return input.trim();
    }
    return input;
  }

  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitizePayload(item, { trimStrings }));
  }

  const cleanObject = {};

  for (const [key, value] of Object.entries(input)) {
    if (FORBIDDEN_KEYS.has(key)) {
      continue;
    }

    if (typeof value === 'string' && trimStrings) {
      cleanObject[key] = value.trim();
    } else if (value && typeof value === 'object') {
      cleanObject[key] = sanitizePayload(value, { trimStrings });
    } else {
      cleanObject[key] = value;
    }
  }

  return cleanObject;
}

export default sanitizePayload;
