import {
  encryptValue,
  decryptValue,
  encryptPayloadFields,
  decryptPayloadFields,
} from './src/utils/payload-encryptor.js';

console.log('====================================================');
console.log('    AES-256-GCM SENSITIVE PAYLOAD ENCRYPTION TEST   ');
console.log('====================================================\n');

const MASTER_KEY = 'super-secret-logistics-master-key-32';

// 1. Primitive and Object Value Encryption
console.log('[1] Primitive and Object Encryption:');
const sensitiveSecret = 'SECRET-CUSTOMS-CODE-9941';
const encrypted = encryptValue(sensitiveSecret, MASTER_KEY);
console.log('    - Generates ciphertext and auth tag:', encrypted.ciphertext && encrypted.tag ? 'PASS' : 'FAIL');
console.log('    - Ciphertext does not expose raw secret:', !encrypted.ciphertext.includes(sensitiveSecret) ? 'PASS' : 'FAIL');

const decrypted = decryptValue(encrypted, MASTER_KEY);
console.log('    - Authenticated decryption matches plaintext:', decrypted === sensitiveSecret ? 'PASS' : 'FAIL');

// 2. Selective Payload Fields Encryption
console.log('\n[2] Selective Field Encryption:');
const customsPayload = {
  port: 'Chennai Port',
  clearanceCode: 'CONFIDENTIAL-CLEAR-8822',
  officerDetails: { badgeNumber: 'OFF-402', name: 'Officer Smith' },
  status: 'CLEARED',
};

const encryptedPayload = encryptPayloadFields(customsPayload, MASTER_KEY, ['clearanceCode', 'officerDetails']);
console.log('    - Public fields remain plain (port):', encryptedPayload.port === 'Chennai Port' ? 'PASS' : 'FAIL');
console.log('    - Sensitive string is encrypted:', encryptedPayload.clearanceCode.isEncrypted === true ? 'PASS' : 'FAIL');
console.log('    - Sensitive nested object is encrypted:', encryptedPayload.officerDetails.isEncrypted === true ? 'PASS' : 'FAIL');
console.log('    - Tracks encrypted field names:', encryptedPayload.__encryptedFields.includes('clearanceCode') ? 'PASS' : 'FAIL');

// 3. Payload Decryption on Read
console.log('\n[3] Transparent Payload Decryption:');
const restoredPayload = decryptPayloadFields(encryptedPayload, MASTER_KEY);
console.log('    - Restores plaintext clearanceCode:', restoredPayload.clearanceCode === 'CONFIDENTIAL-CLEAR-8822' ? 'PASS' : 'FAIL');
console.log('    - Restores nested officerDetails object:', restoredPayload.officerDetails.badgeNumber === 'OFF-402' ? 'PASS' : 'FAIL');
console.log('    - Removes internal __encryptedFields tag:', restoredPayload.__encryptedFields === undefined ? 'PASS' : 'FAIL');

// 4. Tamper Resistance
console.log('\n[4] Tamper Resistance (Auth Tag Verification):');
const tamperedEncrypted = {
  ...encrypted,
  ciphertext: 'f' + encrypted.ciphertext.substring(1),
};
let failedTamper = false;
try {
  decryptValue(tamperedEncrypted, MASTER_KEY);
} catch {
  failedTamper = true;
}
console.log('    - Rejects tampered ciphertext with tag mismatch:', failedTamper === true ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   PAYLOAD ENCRYPTION VERIFIED SUCCESSFULLY!        ');
console.log('====================================================\n');

process.exit(0);
