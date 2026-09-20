const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const DEFAULT_SENSITIVE_KEYS = new Set([
  'password', 'secret', 'token', 'apiKey', 'api_key',
  'authorization', 'ssn', 'creditCard', 'credit_card', 'cvv',
]);

const MASK_CHAR = '***';

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

/**
 * Replace sensitive field values with a mask string.
 * Safe to use on event payloads before writing to logs or external sinks.
 *
 * @param {object}   obj           - Object to mask
 * @param {Set|string[]} [sensitiveKeys] - Override default sensitive key list
 * @param {string}   [mask]        - Replacement string (default: '***')
 * @returns {object} New object with sensitive values replaced
 */
export function maskSensitiveFields(obj, sensitiveKeys = DEFAULT_SENSITIVE_KEYS, mask = MASK_CHAR) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const keySet = sensitiveKeys instanceof Set ? sensitiveKeys : new Set(sensitiveKeys);
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    if (keySet.has(key)) {
      result[key] = mask;
    } else if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = maskSensitiveFields(value, keySet, mask);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export default sanitizePayload;
