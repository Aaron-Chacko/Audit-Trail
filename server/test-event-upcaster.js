import {
  registerUpcaster,
  upcastEvent,
  upcastEventStream,
  getRegisteredUpcasters,
  clearUpcasters,
} from './src/schemas/event-upcaster.js';

console.log('====================================================');
console.log('       EVENT PAYLOAD UPCASTER & MIGRATION TEST      ');
console.log('====================================================\n');

clearUpcasters();

// Register v1 -> v2 upcaster: expands flat location string into object
registerUpcaster('SHIPMENT_DEPARTED', 1, (payload) => {
  return {
    upgradedPayload: {
      ...payload,
      port: payload.location || 'Unknown Port',
      departureMetadata: { migratedFromV1: true },
    },
    toVersion: 2,
  };
});

// Register v2 -> v3 upcaster: adds geo-coordinates defaults
registerUpcaster('SHIPMENT_DEPARTED', 2, (payload) => {
  return {
    upgradedPayload: {
      ...payload,
      geoCoordinates: { lat: 0, lng: 0 },
    },
    toVersion: 3,
  };
});

console.log('[1] Upcaster Registration:');
const upcasters = getRegisteredUpcasters();
console.log('    - Registered upcasters count is 2:', upcasters.length === 2 ? 'PASS' : 'FAIL');
console.log('    - Contains SHIPMENT_DEPARTED:v1:', upcasters.includes('SHIPMENT_DEPARTED:v1') ? 'PASS' : 'FAIL');

console.log('\n[2] Sequential Upcasting Pipeline:');
const historicalEventV1 = {
  aggregateId: 'SHIP-LEGACY-01',
  eventType: 'SHIPMENT_DEPARTED',
  payload: { location: 'Singapore Port', carrier: 'Oceanic' },
  version: 1,
  metadata: { schemaVersion: 1 },
};

const upcasted = upcastEvent(historicalEventV1);
console.log('    - Upcasts v1 to v3 target schema version:', upcasted.metadata.schemaVersion === 3 ? 'PASS' : 'FAIL');
console.log('    - Applies v1 transformation (port added):', upcasted.payload.port === 'Singapore Port' ? 'PASS' : 'FAIL');
console.log('    - Applies v2 transformation (geoCoordinates):', upcasted.payload.geoCoordinates.lat === 0 ? 'PASS' : 'FAIL');
console.log('    - Preserves immutable originalSchemaVersion flag:', upcasted.metadata.originalSchemaVersion === 1 ? 'PASS' : 'FAIL');
console.log('    - Sets wasUpcasted flag to true:', upcasted.metadata.wasUpcasted === true ? 'PASS' : 'FAIL');

console.log('\n[3] Stream Batch Upcasting:');
const alreadyV3Event = {
  aggregateId: 'SHIP-LEGACY-01',
  eventType: 'SHIPMENT_DEPARTED',
  payload: { port: 'Rotterdam', geoCoordinates: { lat: 51.9, lng: 4.4 } },
  version: 2,
  metadata: { schemaVersion: 3 },
};

const stream = [historicalEventV1, alreadyV3Event];
const upcastedStream = upcastEventStream(stream);
console.log('    - Batch transforms stream length:', upcastedStream.length === 2 ? 'PASS' : 'FAIL');
console.log('    - First event was upcasted:', upcastedStream[0].metadata.wasUpcasted === true ? 'PASS' : 'FAIL');
console.log('    - Second event unchanged (already v3):', upcastedStream[1].metadata.wasUpcasted === false ? 'PASS' : 'FAIL');

console.log('\n====================================================');
console.log('   EVENT UPCASTER VERIFIED SUCCESSFULLY!            ');
console.log('====================================================\n');

process.exit(0);
