/**
 * utils/app-errors.js
 *
 * Custom error classes used across the application.
 *
 * Using named error classes (instead of plain Error) lets the central
 * error handler distinguish and respond correctly without fragile
 * string matching on err.message.
 */

/**
 * Thrown by command services when an expectedVersion doesn't match
 * the current aggregate version.
 * → HTTP 409 Conflict
 */
export class ConcurrencyError extends Error {
  constructor(aggregateId, expectedVersion, actualVersion) {
    super(
      `Concurrency conflict on aggregate "${aggregateId}": ` +
      `expected version ${expectedVersion} but current version is ${actualVersion}.`
    );
    this.name = 'ConcurrencyError';
    this.status = 409;
  }
}

/**
 * Thrown by query services when a requested aggregate does not exist.
 * → HTTP 404 Not Found
 */
export class NotFoundError extends Error {
  constructor(resource, id) {
    super(`${resource} with id "${id}" was not found.`);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

/**
 * Thrown when a caller attempts a mutating operation on the Event Store.
 * (Also enforced at the Mongoose hook level in models/Event.js.)
 * → HTTP 403 Forbidden
 */
export class ImmutabilityViolation extends Error {
  constructor(message = 'The event store is append-only. Mutations are forbidden.') {
    super(message);
    this.name = 'ImmutabilityViolation';
    this.status = 403;
  }
}
