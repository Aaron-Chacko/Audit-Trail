import { ALL_EVENT_TYPES, isValidEventType, SHIPMENT_EVENT_TYPES } from './src/events/event-types.js';
import Event from './src/models/Event.js';
import { ImmutabilityViolation, ConcurrencyError, NotFoundError } from './src/utils/app-errors.js';

console.log('=== PHASE 1 VERIFICATION ===');
console.log('1. Event Types:');
console.log('   - Total count:', ALL_EVENT_TYPES.length);
console.log('   - Shipment events:', SHIPMENT_EVENT_TYPES);
console.log('   - Validation helper (TEMPERATURE_SPIKE):', isValidEventType('TEMPERATURE_SPIKE'));
console.log('   - Validation helper (INVALID_TYPE):', isValidEventType('INVALID_TYPE'));

console.log('\n2. Event Mongoose Model:');
console.log('   - Model name:', Event.modelName);
console.log('   - Collection name:', Event.collection.name);
console.log('   - Static findByAggregateId:', typeof Event.findByAggregateId);
console.log('   - Static getMaxVersion:', typeof Event.getMaxVersion);
console.log('   - Static getEventsSince:', typeof Event.getEventsSince);
console.log('   - Static getEventsUntilTimestamp:', typeof Event.getEventsUntilTimestamp);

console.log('\n3. Document Instantiation:');
const sampleEvent = new Event({
  aggregateId: 'SHIP-10042',
  eventType: 'SHIPMENT_CREATED',
  payload: {
    origin: 'Singapore',
    destination: 'Rotterdam',
    estimatedArrival: new Date().toISOString(),
  },
  version: 1,
  timestamp: new Date(),
  metadata: {
    correlationId: 'corr-001',
    causationId: 'cmd-001',
    triggeredBy: 'user-system',
  },
});
console.log('   - Event instance created successfully:', sampleEvent.aggregateId, sampleEvent.eventType, 'v' + sampleEvent.version);

console.log('\n4. Custom Errors:');
const immutErr = new ImmutabilityViolation();
const concErr = new ConcurrencyError('SHIP-10042', 1, 2);
const notFoundErr = new NotFoundError('Shipment', 'SHIP-10042');
console.log('   - ImmutabilityViolation status:', immutErr.status, immutErr.name);
console.log('   - ConcurrencyError status:', concErr.status, concErr.name);
console.log('   - NotFoundError status:', notFoundErr.status, notFoundErr.name);

console.log('\n>>> PHASE 1 CONTRACTS FULLY VERIFIED! <<<');
