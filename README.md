# Audit Trail

## Event-Sourced Inventory & Logistics Ledger

Audit Trail is an advanced MERN-stack application built around **Event Sourcing** and **CQRS (Command Query Responsibility Segregation)** for tracking inventory and logistics events.

Unlike traditional CRUD applications that overwrite the current state of an entity, Audit Trail maintains an **immutable, chronological record of every event**. The current state of a shipment or container can be reconstructed by replaying its historical event stream.

---

## 📌 Problem Statement

Traditional CRUD systems focus on storing the current state of an entity.

For example:

```text
Inventory: 10
      ↓
Update
      ↓
Inventory: 5
```

The previous state may be overwritten and become unavailable.

In logistics and other systems where traceability is important, every state transition needs to be preserved.

Audit Trail instead stores events:

```text
CONTAINER_CREATED
        ↓
LOADED_ON_SHIP
        ↓
TEMPERATURE_SPIKE
        ↓
ARRIVED_AT_PORT
```

The complete event history becomes the source of truth for reconstructing the current state.

---

## 🎯 Use Case

A logistics manager views the Audit Trail dashboard for a specific shipping container.

Instead of simply querying MongoDB for the container's current location, the Node.js backend reconstructs the container's state by replaying its historical event stream.

For example:

```text
CONTAINER_CREATED
        ↓
LOADED_ON_SHIP
        ↓
TEMPERATURE_SPIKE
        ↓
ARRIVED_AT_PORT
```

This allows the manager to:

- View the complete chronological event history
- Determine when specific events occurred
- Investigate incidents such as temperature spikes
- Reconstruct the state of a shipment at a previous point in time
- Analyze sensor data alongside shipment events
- Maintain an immutable audit trail

---

## 🏗️ Architecture

```text
                         ┌──────────────────────┐
                         │      React Client    │
                         │                      │
                         │  Dashboard           │
                         │  Shipment Search     │
                         │  Event Timeline      │
                         │  State Scrubber      │
                         │  Sensor Charts       │
                         └──────────┬───────────┘
                                    │
                                  REST API
                                    │
                         ┌──────────▼───────────┐
                         │   Node.js / Express  │
                         │                      │
                         │        CQRS          │
                         └────────┬──────┬───────┘
                                  │      │
                            Commands      Queries
                                  │      │
                                  ▼      ▼
                         ┌────────────┐ ┌────────────┐
                         │   Event    │ │    Read    │
                         │   Store    │ │    Model   │
                         │  MongoDB   │ │  MongoDB   │
                         └──────┬─────┘ └──────▲─────┘
                                │              │
                                │              │
                                └──────┬───────┘
                                       │
                                Projection Worker
```

---

## 🔄 Event Sourcing

Event Sourcing treats events as the source of truth instead of storing only the current state.

Each event represents a state transition.

Example:

```json
{
  "aggregateId": "SHIP-10042",
  "eventType": "TEMPERATURE_SPIKE",
  "payload": {
    "temperature": 12.8,
    "threshold": 8
  },
  "timestamp": "2026-08-25T10:30:00Z",
  "version": 4
}
```

The current state can then be reconstructed by replaying the event stream:

```text
CONTAINER_CREATED
        ↓
LOADED_ON_SHIP
        ↓
TEMPERATURE_SPIKE
        ↓
ARRIVED_AT_PORT
        ↓
State Reconstruction
        ↓
Current State
```

---

## 🧩 CQRS

Audit Trail separates operations that modify the system from operations that retrieve information.

### Commands

Commands represent operations that change system state.

Examples include:

```text
Create Shipment
Move Shipment
Record Temperature Spike
Update Shipment Status
```

The command is validated and results in one or more events being appended to the Event Store.

### Queries

Queries retrieve information without modifying the Event Store.

Examples include:

```text
Get Current Shipment State
Get Shipment Event History
Get Historical Shipment State
Get Sensor Metrics
```

Separating Commands and Queries allows the write and read sides of the application to be optimized independently.

---

## 🗄️ Event Store

MongoDB is used as the Event Store.

The Event Store follows an **append-only design**, meaning events are added to the event stream rather than being updated or deleted.

Each event contains information such as:

| Field | Description |
|---|---|
| `aggregateId` | Identifies the shipment or container |
| `eventType` | Type of event that occurred |
| `payload` | Event-specific data |
| `timestamp` | Time the event occurred |
| `version` | Version of the aggregate |

Example:

```json
{
  "aggregateId": "SHIP-10042",
  "eventType": "CONTAINER_LOADED",
  "payload": {
    "port": "Chennai"
  },
  "timestamp": "2026-08-25T09:15:00Z",
  "version": 2
}
```

---

## 📊 Read Models & Projections

An event stream can become large over time. Replaying every event for every query would therefore be inefficient.

Audit Trail uses a separate **Read Model** optimized for querying.

```text
Event Store
     │
     │ New Event
     ▼
Projection Worker
     │
     ▼
Read Model
     │
     ▼
Optimized Queries
```

The projection layer processes new events and updates a separate MongoDB collection containing the data required by the Query side.

---

## ⏪ Historical State Reconstruction

One of the key capabilities of Audit Trail is reconstructing the state of a shipment at a specific point in time.

```text
Current State
      │
      │ Replay events up to
      │ 3 days ago
      ▼
State 3 Days Ago
```

The frontend will provide a state-scrubbing interface that allows users to rewind through the shipment's history and inspect how its state evolved.

---

## 🔐 Optimistic Concurrency Control

Audit Trail uses **Optimistic Concurrency Control (OCC)** to prevent conflicting commands from corrupting an aggregate.

Example:

```text
Client A → Version 5
Client B → Version 5

Client A submits command
        ↓
Event appended
        ↓
Version 6

Client B submits command
        ↓
Expected Version: 5
Actual Version: 6
        ↓
Command Rejected
```

If the event version has changed since a client retrieved the aggregate, the command is rejected instead of being appended using stale information.

---

## 📈 Sensor Analytics

The dashboard will use **Recharts** to visualize logistics sensor data alongside the event timeline.

Planned visualizations include:

- Temperature fluctuations
- Sensor readings over time
- Event timeline correlation
- Shipment activity
- Historical sensor states

---

## 🛠️ Tech Stack

### Frontend

- React.js
- Recharts

### Backend

- Node.js
- Express.js
- CQRS
- Event Sourcing

### Database

- MongoDB
- Append-only Event Store
- Read Model / Projection Store

### Development

- Git
- GitHub
- Postman
- npm

---

## 📁 Project Structure

The project structure is organized around the CQRS and Event Sourcing architecture rather than a traditional CRUD controller/model structure.

```text
audit-trail/
│
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       │
│       ├── components/
│       │   ├── common/
│       │   ├── dashboard/
│       │   ├── shipments/
│       │   ├── timeline/
│       │   └── charts/
│       │
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── ShipmentDetails.jsx
│       │   └── NotFound.jsx
│       │
│       ├── services/
│       │   └── api.js
│       │
│       ├── hooks/
│       ├── context/
│       ├── utils/
│       │
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   └── src/
│       ├── config/
│       │   ├── db.js
│       │   └── env.js
│       │
│       ├── commands/
│       │   ├── shipment/
│       │   │   ├── createShipment.js
│       │   │   ├── moveShipment.js
│       │   │   └── recordTemperature.js
│       │   └── index.js
│       │
│       ├── queries/
│       │   ├── shipment/
│       │   │   ├── getShipment.js
│       │   │   ├── getEvents.js
│       │   │   └── getHistory.js
│       │   └── index.js
│       │
│       ├── events/
│       │   ├── eventTypes.js
│       │   ├── eventStore.js
│       │   └── eventPublisher.js
│       │
│       ├── aggregates/
│       │   └── shipment/
│       │       ├── shipmentAggregate.js
│       │       └── shipmentReducer.js
│       │
│       ├── projections/
│       │   ├── shipmentProjection.js
│       │   └── projectionWorker.js
│       │
│       ├── models/
│       │   ├── Event.js
│       │   └── ShipmentReadModel.js
│       │
│       ├── routes/
│       │   ├── commandRoutes.js
│       │   └── queryRoutes.js
│       │
│       ├── services/
│       │   ├── concurrencyService.js
│       │   └── replayService.js
│       │
│       ├── middleware/
│       │   ├── errorHandler.js
│       │   └── validation.js
│       │
│       ├── utils/
│       │
│       ├── app.js
│       └── server.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Development Roadmap

### Week 1 — CQRS Setup

- [ ] Set up Express backend
- [ ] Establish CQRS architecture
- [ ] Create separate Command and Query routes
- [ ] Build shipment search interface
- [ ] Establish initial API structure

### Week 2 — Event Store

- [ ] Design MongoDB Event Store
- [ ] Implement append-only event persistence
- [ ] Add aggregate IDs
- [ ] Add event types
- [ ] Add event versions
- [ ] Build chronological event timeline
- [ ] Verify Event Store immutability
- [ ] Implement state reconstruction through event replay

### Week 3 — Projections & Historical State

- [ ] Implement Read Model
- [ ] Build projection worker
- [ ] Update Read Model from new events
- [ ] Implement historical state reconstruction
- [ ] Build state-scrubbing interface
- [ ] Connect event history with reconstructed states

### Week 4 — Concurrency & Analytics

- [ ] Implement Optimistic Concurrency Control
- [ ] Reject stale commands
- [ ] Integrate Recharts
- [ ] Visualize temperature fluctuations
- [ ] Overlay sensor metrics with event timelines
- [ ] Polish dashboard UX

---

## 🔍 Example Event Stream

A shipment could generate the following event sequence:

```text
SHIPMENT_CREATED
        ↓
CONTAINER_LOADED
        ↓
SHIPMENT_DEPARTED
        ↓
TEMPERATURE_SPIKE
        ↓
SHIPMENT_ARRIVED
        ↓
CONTAINER_UNLOADED
```

Every event remains part of the permanent historical record.

The aggregate's state is derived from the sequence of events rather than relying only on a mutable current-state document.

---

## ⚖️ CRUD vs Event Sourcing

| Traditional CRUD | Audit Trail |
|---|---|
| Current state is primary | Events are the source of truth |
| Updates overwrite values | Events are appended |
| Historical state may be lost | Complete history is preserved |
| Simple read/write architecture | CQRS separation |
| Limited auditability | Full chronological audit trail |
| Current state retrieval | State reconstruction |
| Mutable records | Immutable event stream |

---

## 🎯 Project Goals

Audit Trail is designed to demonstrate practical understanding of:

- Event Sourcing
- CQRS
- Immutable event stores
- MongoDB data modeling
- Event replay
- State reconstruction
- Temporal analysis
- Read-model projections
- Optimistic Concurrency Control
- Node.js backend architecture
- React data visualization

The project intentionally moves beyond basic CRUD development toward **enterprise-oriented software architecture** for applications where traceability, historical state, and data integrity are critical.

---

## 📌 Status

🚧 **In Development**

The project is being developed incrementally, beginning with the CQRS foundation and Event Store before progressing to projections, historical state reconstruction, concurrency control, and analytics.

---

## 📄 Project Specification

This project is part of the **Axlero Solutions Advanced MERN Stack Engineering** project series.

**Project:** Audit Trail — Event-Sourced Inventory & Logistics Ledger
