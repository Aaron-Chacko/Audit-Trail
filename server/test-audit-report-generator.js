/**
 * Test Suite: Markdown Audit Compliance Report Generator
 */
import assert from 'assert';
import { generateAuditReportMarkdown } from '../client/src/utils/audit-report-generator.js';

console.log('====================================================');
console.log('       AUDIT COMPLIANCE REPORT GENERATOR TEST       ');
console.log('====================================================\n');

const shipmentId = 'SHP-RPT-8800';
const mockEvents = [
  {
    version: 1,
    eventType: 'SHIPMENT_CREATED',
    timestamp: '2026-09-20T08:00:00.000Z',
    payload: { origin: 'Port Shanghai', destination: 'Port Rotterdam' },
    hash: 'a1b2c3d4e5f6a1b2c3d4e5f6'
  },
  {
    version: 2,
    eventType: 'LOADED_ON_SHIP',
    timestamp: '2026-09-20T12:00:00.000Z',
    payload: { location: 'Berth 4' },
    hash: 'b2c3d4e5f6a1b2c3d4e5f6a1'
  }
];

const mockCurrentState = {
  version: 2,
  status: 'IN_TRANSIT',
  origin: 'Port Shanghai',
  destination: 'Port Rotterdam'
};

console.log('[1] Markdown Report Generation:');
const markdown = generateAuditReportMarkdown({
  shipmentId,
  events: mockEvents,
  currentState: mockCurrentState,
  integrityStatus: { isValid: true, algorithm: 'SHA-256 Hash Chain' }
});

assert.strictEqual(markdown.includes('AUDIT TRAIL COMPLIANCE LEDGER REPORT'), true);
assert.strictEqual(markdown.includes(shipmentId), true);
assert.strictEqual(markdown.includes('VERIFIED & UNTAMPERED'), true);
assert.strictEqual(markdown.includes('SHIPMENT_CREATED'), true);
assert.strictEqual(markdown.includes('LOADED_ON_SHIP'), true);
assert.strictEqual(markdown.includes('Port Shanghai ➔ Port Rotterdam'), true);
console.log('    - Markdown headers, summary tables, and event rows generated: PASS');

console.log('[2] Tamper Detection Flagging in Report:');
const tamperedReport = generateAuditReportMarkdown({
  shipmentId,
  events: mockEvents,
  currentState: mockCurrentState,
  integrityStatus: { isValid: false, algorithm: 'SHA-256 Hash Chain' }
});

assert.strictEqual(tamperedReport.includes('INTEGRITY VIOLATION DETECTED'), true);
console.log('    - Correctly renders integrity failure alert: PASS');

console.log('\n====================================================');
console.log('    ALL AUDIT REPORT GENERATOR TESTS PASSED! (2/2)  ');
console.log('====================================================\n');
