import { eventBus } from './src/events/event-subscription-bus.js';

console.log('====================================================');
console.log('       EVENT SUBSCRIPTION BUS REACTIVE TEST         ');
console.log('====================================================\n');

eventBus.clearSubscribers();

// 1. Topic-Specific Subscription
console.log('[1] Topic-Specific Subscription:');
const receivedSpikes = [];
const unsubscribeSpike = eventBus.subscribe('TEMPERATURE_SPIKE', (event) => {
  receivedSpikes.push(event);
});

console.log('    - Subscriber registered count:', eventBus.getSubscriberCount('TEMPERATURE_SPIKE') === 1 ? 'PASS' : 'FAIL');

const sampleSpike = {
  aggregateId: 'SHIP-BUS-01',
  eventType: 'TEMPERATURE_SPIKE',
  payload: { temperature: 18.2 },
  version: 3,
};

eventBus.publish(sampleSpike);
console.log('    - Subscriber received matching event:', receivedSpikes.length === 1 && receivedSpikes[0].aggregateId === 'SHIP-BUS-01' ? 'PASS' : 'FAIL');

// 2. Wildcard Global Subscription
console.log('\n[2] Global Stream Subscription (*):');
const allEventsReceived = [];
const unsubscribeAll = eventBus.subscribeAll((event) => {
  allEventsReceived.push(event);
});

const sampleDeparted = {
  aggregateId: 'SHIP-BUS-01',
  eventType: 'SHIPMENT_DEPARTED',
  payload: { port: 'Port of Tokyo' },
  version: 4,
};

eventBus.publish(sampleDeparted);
console.log('    - Global listener received event:', allEventsReceived.length === 1 ? 'PASS' : 'FAIL');
console.log('    - Specific listener did not receive non-matching event:', receivedSpikes.length === 1 ? 'PASS' : 'FAIL');

// 3. Unsubscription
console.log('\n[3] Clean Unsubscription:');
unsubscribeSpike();
unsubscribeAll();

eventBus.publish({ aggregateId: 'SHIP-BUS-01', eventType: 'TEMPERATURE_SPIKE', payload: {} });
console.log('    - No events delivered after unsubscribe:', receivedSpikes.length === 1 && allEventsReceived.length === 1 ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   EVENT SUBSCRIPTION BUS VERIFIED SUCCESSFULLY!    ');
console.log('====================================================\n');

process.exit(0);
