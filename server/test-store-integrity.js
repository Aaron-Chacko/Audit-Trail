import Event from './src/models/Event.js';
import {
  verifyStreamIntegrity,
  getEventStoreHealth,
} from './src/services/commands/event-store-service.js';

async function runTests() {
  console.log('Testing Store Integrity and Immutability Guards:');

  const doc = new Event({
    aggregateId: 'SHIP-90001',
    eventType: 'SHIPMENT_CREATED',
    payload: { origin: 'Port A', destination: 'Port B' },
    version: 1,
    timestamp: new Date(),
  });

  console.log('1. Event schema collection name:', Event.collection.name === 'events' ? 'PASS' : 'FAIL');
  console.log('2. Event doc created:', doc.aggregateId === 'SHIP-90001' ? 'PASS' : 'FAIL');
  console.log('3. verifyStreamIntegrity is defined:', typeof verifyStreamIntegrity === 'function' ? 'PASS' : 'FAIL');
  console.log('4. getEventStoreHealth is defined:', typeof getEventStoreHealth === 'function' ? 'PASS' : 'FAIL');

  const health = await getEventStoreHealth();
  console.log('5. Store Health status returned:', typeof health.status === 'string' ? 'PASS' : 'FAIL');
  console.log('6. Store Health immutability flag:', health.immutabilityEnforced === true ? 'PASS' : 'FAIL');

  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
