# Command API — Example Requests

All routes are prefixed with `/api/commands`. All responses follow `{ success, data, error }`.

## Create Shipment
`POST /api/commands/shipments`
```json
{
  "aggregateId": "SHIP-001",
  "destination": "Hamburg",
  "type": "refrigerated",
  "maxCapacity": 20000
}
```
→ Appends `CONTAINER_CREATED`, expectedVersion 0.

## Move Shipment
`POST /api/commands/shipments/:id/move`
```json
{
  "toStatus": "LOADED_ON_SHIP",
  "vesselId": "VES-01",
  "port": "Rotterdam"
}
```
or
```json
{
  "toStatus": "ARRIVED_AT_PORT",
  "port": "Hamburg",
  "terminal": "T4"
}
```
→ Appends `LOADED_ON_SHIP` or `ARRIVED_AT_PORT` depending on `toStatus`.

## Record Temperature
`POST /api/commands/shipments/:id/temperature`
```json
{
  "temperature": 9.2,
  "threshold": 8,
  "unit": "C",
  "sensorId": "SENSOR-04"
}
```
→ Appends `TEMPERATURE_SPIKE`.

## Cancel Shipment
`POST /api/commands/shipments/:id/cancel`
```json
{
  "reason": "Customs rejection",
  "cancelledBy": "ops-team"
}
```
→ Appends `SHIPMENT_CANCELLED`.

## Notes
- All commands except create use the aggregate's current version for OCC — a stale request returns `409`.
- All four call into `appendEvent` in `services/commands/event-store-service.js`, built by Mayank.