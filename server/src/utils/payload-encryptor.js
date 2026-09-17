import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function deriveKey(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest();
}

export function encryptValue(value, secretKey) {
  if (value === null || value === undefined) {
    return value;
  }

  const key = deriveKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag,
    isEncrypted: true,
  };
}

export function decryptValue(encryptedObj, secretKey) {
  if (!encryptedObj || typeof encryptedObj !== 'object' || !encryptedObj.isEncrypted) {
    return encryptedObj;
  }

  const key = deriveKey(secretKey);
  const iv = Buffer.from(encryptedObj.iv, 'hex');
  const tag = Buffer.from(encryptedObj.tag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedObj.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}

export function encryptPayloadFields(payload, secretKey, fieldsToEncrypt = []) {
  if (!payload || typeof payload !== 'object' || !secretKey || fieldsToEncrypt.length === 0) {
    return payload;
  }

  const cloned = { ...payload };
  const targetFields = new Set(fieldsToEncrypt);
  const encryptedFieldList = [];

  for (const field of targetFields) {
    if (field in cloned && cloned[field] !== undefined && cloned[field] !== null) {
      cloned[field] = encryptValue(cloned[field], secretKey);
      encryptedFieldList.push(field);
    }
  }

  if (encryptedFieldList.length > 0) {
    cloned.__encryptedFields = encryptedFieldList;
  }

  return cloned;
}

export function decryptPayloadFields(payload, secretKey) {
  if (!payload || typeof payload !== 'object' || !secretKey || !Array.isArray(payload.__encryptedFields)) {
    return payload;
  }

  const cloned = { ...payload };
  const fields = cloned.__encryptedFields;

  for (const field of fields) {
    if (field in cloned) {
      cloned[field] = decryptValue(cloned[field], secretKey);
    }
  }

  delete cloned.__encryptedFields;
  return cloned;
}

export default {
  encryptValue,
  decryptValue,
  encryptPayloadFields,
  decryptPayloadFields,
};
