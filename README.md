# Audit Trail

## Event-Sourced Inventory & Logistics Ledger

Audit Trail is an advanced MERN-stack application built around **Event Sourcing** and **CQRS (Command Query Responsibility Segregation)** for tracking inventory and logistics events.

Unlike traditional CRUD applications that overwrite the current state of an entity, Audit Trail maintains an **immutable, chronological record of events**. The current state of a shipment or container can be reconstructed by replaying its historical event stream.

---

## Problem Statement

Traditional CRUD systems focus on storing the current state of an entity.

For example:

```text
Inventory: 10
      ↓
Update
      ↓
Inventory: 5
