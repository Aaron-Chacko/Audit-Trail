# Audit Trail — Team Conventions

> This file is the **single authoritative reference** for all coding standards, architecture rules, and naming conventions in this project. All contributors must read it before writing any code. Reviewers should cite it in PR comments where applicable.

---

## 1. Module System

- Use **ES Modules** (`import`/`export`) throughout — no `require()` or `module.exports`.
- `package.json` must contain `"type": "module"`.
- All imports must include the file extension (e.g. `import foo from './foo.js'`).

---

## 2. Async Style

- **`async/await` everywhere.** No `.then()` chains, no callback-style code.
- Every `async` function that may throw must propagate the error to the next Express handler via `next(err)` — not a local `try/catch` that silences it or returns a bespoke JSON shape.

---

## 3. CQRS — Strict Separation

| Side | URL Prefix | Route File | Service Folder |
|---|---|---|---|
| Write (Commands) | `/api/commands` | `routes/command-routes.js` | `services/commands/` |
| Read (Queries) | `/api/queries` | `routes/query-routes.js` | `services/queries/` |

**Rules:**
- Command routes/services must **never** import from `services/queries/` or read from `ShipmentReadModel`.
- Query routes/services must **never** import from `services/commands/` or write to `events`.
- "Current state" queries **always** hit `ShipmentReadModel` — never the Event Store.
- The only permitted exception: query services may read the Event Store for **explicit event history** or **historical state reconstruction** queries.

---

## 4. Event Store — Append-Only

- **No `update`, `findOneAndUpdate`, `updateMany`, `delete`, `deleteMany`** operations on the `events` collection — ever.
- The Mongoose schema in `models/Event.js` enforces this via `pre()` hooks that throw an `ImmutabilityViolation` error.
- If you need to "correct" an event, append a new compensating event instead.

---

## 5. Optimistic Concurrency Control (OCC)

Before appending a new event, the command service must:

1. Read the current max `version` for the `aggregateId`.
2. Compare it against the `expectedVersion` the caller provided.
3. If they differ → throw `ConcurrencyError` (→ HTTP 409).
4. If they match → append the new event with `version = currentVersion + 1`.

The compound unique index `{ aggregateId: 1, version: 1 }` is the last line of defence — a duplicate key error (E11000) from Mongo also signals an OCC conflict.

---

## 6. Event Types

All event type strings live in **`events/event-types.js`** as named exports.

```js
// ✅ Correct
import { TEMPERATURE_SPIKE } from '../events/event-types.js';

// ❌ Wrong — raw string literals cause silent typos and refactoring pain
eventType: 'TEMPERATURE_SPIKE'
```

New event types must be added to `event-types.js` and `ALL_EVENT_TYPES` before use.

---

## 7. API Response Shape

Every endpoint must return exactly this envelope:

```json
{ "success": boolean, "data": <any>, "error": <null | { "message": string }> }
```

Use the helpers in `utils/api-response.js`:

```js
import { sendSuccess, sendError } from '../utils/api-response.js';

sendSuccess(res, { aggregateId: 'SHIP-001' }, 201);
sendError(res, 'Aggregate not found', 404);
```

Never construct a raw `res.json({})` call in a route or controller.

---

## 8. Input Validation

- **Every command route** must have a Joi schema validated by the `validate()` middleware before the controller runs.
- Schemas live alongside the feature they validate (e.g. `schemas/shipment-schemas.js`).
- `validate()` is imported from `middleware/validate.js` and accepts the schema + the `req` source (`'body'`, `'query'`, `'params'`).

```js
router.post('/shipments', validate(createShipmentSchema), controller.create);
```

---

## 9. Error Handling

- All errors must be forwarded via `next(err)` to the central handler in `middleware/error-handler.js`.
- Use the custom error classes from `utils/app-errors.js`:
  - `ConcurrencyError` — OCC conflict (409)
  - `NotFoundError` — resource missing (404)
  - `ImmutabilityViolation` — attempt to mutate Event Store (403)
- Do **not** create ad-hoc error shapes inside controllers or services.

---

## 10. Mongoose Schema Rules

- Every schema must have `timestamps: true` (or explicit `createdAt`/`updatedAt` options) and `versionKey: false`.
- All fields must have **explicit types** — no `type: Object` or untyped mixed objects without a comment explaining why.
- Add a `/** comment */` above any field whose purpose isn't immediately obvious from the name alone (especially `version`, `payload`, `lastEventVersion`, `projectedAt`).
- Every schema must define relevant indexes (unique, compound, sparse) — do not rely on Mongoose's default `_id` only.

---

## 11. Naming Conventions

| Context | Convention | Example |
|---|---|---|
| Variables & functions | `camelCase` | `aggregateId`, `sendSuccess` |
| Mongoose models / classes | `PascalCase` | `Event`, `ShipmentReadModel`, `ConcurrencyError` |
| File names | `kebab-case` | `event-types.js`, `error-handler.js` |
| Git branches | `kebab-case` | `feat/event-store-schema` |
| Event type constants | `SCREAMING_SNAKE_CASE` | `TEMPERATURE_SPIKE` |
| MongoDB collection names | `snake_case` | `events`, `shipment_read_models` |

---

## 12. Environment Variables

- Use `.env` + `dotenv` — no hardcoded URIs, ports, or secrets anywhere in source.
- All values are loaded and validated in `config/env.js`. Import from there — never read `process.env` directly outside that file.
- `.env` is gitignored. `.env.example` is committed and kept up to date.

---

## 13. Folder Structure Reference

```
server/
└── src/
    ├── config/          # env.js, db.js — infrastructure setup
    ├── events/          # event-types.js — constants only
    ├── models/          # Mongoose schemas (Event.js, ShipmentReadModel.js)
    ├── routes/          # Route definitions only (no logic)
    │   ├── command-routes.js
    │   └── query-routes.js
    ├── controllers/
    │   ├── commands/    # Request handlers for write-side
    │   └── queries/     # Request handlers for read-side
    ├── services/
    │   ├── commands/    # Business logic: append events, OCC checks
    │   └── queries/     # Business logic: read model, replay, history
    ├── middleware/      # error-handler.js, validate.js
    ├── utils/           # api-response.js, app-errors.js
    ├── app.js           # Express app factory
    └── server.js        # Entry point
```

---

*Last updated: August 2026. To propose a change to these conventions, open a PR editing this file and get sign-off from the project lead before merging.*
