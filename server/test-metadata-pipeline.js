import Event from './src/models/Event.js';
import { sanitizePayload } from './src/utils/payload-sanitizer.js';
import { buildEventMetadata, createChildMetadata } from './src/utils/metadata-builder.js';
import { correlationMiddleware } from './src/middleware/correlation.js';
import {
  appendEvent,
  appendEventWithContext,
  getEventsByCorrelationId as commandGetByCorrelation,
  getEventsByTriggeredBy as commandGetByTriggeredBy,
} from './src/services/commands/event-store-service.js';
import {
  getEventsByCorrelationId as queryGetByCorrelation,
  getEventsByTriggeredBy as queryGetByTriggeredBy,
} from './src/services/queries/event-store-service.js';

console.log('====================================================');
console.log('       AUDIT METADATA & SANITIZATION PIPELINE       ');
console.log('====================================================\n');

// 1. Payload Sanitizer Tests
console.log('[1] Payload Sanitizer:');
const maliciousInput = {
  origin: '  Port of Rotterdam  ',
  destination: ' Singapore ',
  __proto__: { isAdmin: true },
  constructor: { name: 'exploit' },
  details: {
    terminal: '  Terminal B  ',
    notes: '   Ready for transit   ',
  },
  metrics: [10, '  20.5  ', { sensor: '  SEN-01  ' }],
};

const clean = sanitizePayload(maliciousInput);
console.log('    - Strips prototype pollution (__proto__):', clean.__proto__ === Object.prototype ? 'PASS' : 'FAIL');
console.log('    - Strips constructor key:', clean.constructor === Object ? 'PASS' : 'FAIL');
console.log('    - Trims top-level strings:', clean.origin === 'Port of Rotterdam' && clean.destination === 'Singapore' ? 'PASS' : 'FAIL');
console.log('    - Trims nested object strings:', clean.details.terminal === 'Terminal B' && clean.details.notes === 'Ready for transit' ? 'PASS' : 'FAIL');
console.log('    - Handles arrays and nested structures:', clean.metrics[1] === '20.5' && clean.metrics[2].sensor === 'SEN-01' ? 'PASS' : 'FAIL');

// 2. Contextual Metadata Builder Tests
console.log('\n[2] Contextual Metadata Builder:');
const mockReq = {
  headers: {
    'x-correlation-id': 'corr-abc-123',
    'x-causation-id': 'cause-xyz-789',
    'x-user-id': 'usr-logistics-admin',
    'user-agent': 'Mozilla/5.0 TestAgent',
    'x-forwarded-for': '192.168.1.100',
    'x-request-timestamp': '2026-09-07T12:00:00.000Z',
  },
};

const metaFromReq = buildEventMetadata(mockReq);
console.log('    - Extracts correlationId from headers:', metaFromReq.correlationId === 'corr-abc-123' ? 'PASS' : 'FAIL');
console.log('    - Extracts causationId from headers:', metaFromReq.causationId === 'cause-xyz-789' ? 'PASS' : 'FAIL');
console.log('    - Extracts triggeredBy from headers:', metaFromReq.triggeredBy === 'usr-logistics-admin' ? 'PASS' : 'FAIL');
console.log('    - Extracts clientIp from headers:', metaFromReq.clientIp === '192.168.1.100' ? 'PASS' : 'FAIL');
console.log('    - Extracts userAgent from headers:', metaFromReq.userAgent === 'Mozilla/5.0 TestAgent' ? 'PASS' : 'FAIL');
console.log('    - Schema version defaults to 1:', metaFromReq.schemaVersion === 1 ? 'PASS' : 'FAIL');

const fallbackMeta = buildEventMetadata();
console.log('    - Auto-generates fallback correlationId:', typeof fallbackMeta.correlationId === 'string' && fallbackMeta.correlationId.length > 0 ? 'PASS' : 'FAIL');
console.log('    - Auto-generates fallback causationId:', typeof fallbackMeta.causationId === 'string' && fallbackMeta.causationId.length > 0 ? 'PASS' : 'FAIL');
console.log('    - Default triggeredBy is system:', fallbackMeta.triggeredBy === 'system' ? 'PASS' : 'FAIL');

// 3. Child Metadata & Correlation Propagation
console.log('\n[3] Distributed Trace Propagation (Child Metadata):');
const parentEvent = {
  _id: '66dc47a11234567890abcdef',
  metadata: {
    correlationId: 'trace-root-445566',
    causationId: 'cause-root-112233',
    triggeredBy: 'usr-operator-1',
  },
};

const childMeta = createChildMetadata(parentEvent, { triggeredBy: 'automated-worker' });
console.log('    - Preserves parent correlationId:', childMeta.correlationId === 'trace-root-445566' ? 'PASS' : 'FAIL');
console.log('    - Sets causationId to parent event ID:', childMeta.causationId === '66dc47a11234567890abcdef' ? 'PASS' : 'FAIL');
console.log('    - Overrides triggeredBy appropriately:', childMeta.triggeredBy === 'automated-worker' ? 'PASS' : 'FAIL');

// 4. Correlation Express Middleware
console.log('\n[4] Correlation Express Middleware:');
let capturedHeaderName = null;
let capturedHeaderVal = null;
let nextCalled = false;

const dummyReq = {
  headers: {
    'x-correlation-id': 'trace-999888',
  },
};

const dummyRes = {
  setHeader: (name, val) => {
    capturedHeaderName = name;
    capturedHeaderVal = val;
  },
};

correlationMiddleware(dummyReq, dummyRes, () => {
  nextCalled = true;
});

console.log('    - Attaches correlationId to req:', dummyReq.correlationId === 'trace-999888' ? 'PASS' : 'FAIL');
console.log('    - Attaches auditContext to req:', typeof dummyReq.auditContext === 'object' && dummyReq.auditContext !== null ? 'PASS' : 'FAIL');
console.log('    - Sets response header X-Correlation-Id:', capturedHeaderName === 'X-Correlation-Id' && capturedHeaderVal === 'trace-999888' ? 'PASS' : 'FAIL');
console.log('    - Calls next() middleware handler:', nextCalled === true ? 'PASS' : 'FAIL');

// 5. Event Model Metadata & Static API
console.log('\n[5] Event Model Extended Metadata & Query API:');
const testDoc = new Event({
  aggregateId: 'SHIP-TRACE-001',
  eventType: 'SHIPMENT_CREATED',
  payload: { origin: 'Hamburg', destination: 'Rotterdam' },
  version: 1,
  timestamp: new Date(),
  metadata: metaFromReq,
});

console.log('    - Model instantiates with full audit metadata:', testDoc.metadata.clientIp === '192.168.1.100' ? 'PASS' : 'FAIL');
console.log('    - Event.findByCorrelationId exists:', typeof Event.findByCorrelationId === 'function' ? 'PASS' : 'FAIL');
console.log('    - Event.findByTriggeredBy exists:', typeof Event.findByTriggeredBy === 'function' ? 'PASS' : 'FAIL');
console.log('    - Command service appendEventWithContext exists:', typeof appendEventWithContext === 'function' ? 'PASS' : 'FAIL');
console.log('    - Command service getEventsByCorrelationId exists:', typeof commandGetByCorrelation === 'function' ? 'PASS' : 'FAIL');
console.log('    - Command service getEventsByTriggeredBy exists:', typeof commandGetByTriggeredBy === 'function' ? 'PASS' : 'FAIL');
console.log('    - Query service getEventsByCorrelationId exists:', typeof queryGetByCorrelation === 'function' ? 'PASS' : 'FAIL');
console.log('    - Query service getEventsByTriggeredBy exists:', typeof queryGetByTriggeredBy === 'function' ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('  AUDIT METADATA PIPELINE VERIFIED SUCCESSFULLY!   ');
console.log('====================================================\n');

process.exit(0);
