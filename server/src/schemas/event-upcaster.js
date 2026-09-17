const UPCASTERS = new Map();

export function registerUpcaster(eventType, fromVersion, transformerFn) {
  if (!eventType || typeof transformerFn !== 'function') {
    throw new Error('eventType and transformerFn are required to register an upcaster.');
  }

  const key = `${eventType}:v${fromVersion}`;
  UPCASTERS.set(key, transformerFn);
}

export function upcastEvent(event) {
  if (!event || typeof event !== 'object') {
    return event;
  }

  const eventType = event.eventType;
  const currentSchemaVersion = (event.metadata && event.metadata.schemaVersion) || 1;
  const cloned = JSON.parse(JSON.stringify(event));

  let activeVersion = currentSchemaVersion;
  let activePayload = cloned.payload || {};

  while (true) {
    const key = `${eventType}:v${activeVersion}`;
    const transformer = UPCASTERS.get(key);

    if (!transformer) {
      break;
    }

    const { upgradedPayload, toVersion } = transformer(activePayload);
    activePayload = upgradedPayload || activePayload;
    activeVersion = toVersion || (activeVersion + 1);
  }

  return {
    ...cloned,
    payload: activePayload,
    metadata: {
      ...(cloned.metadata || {}),
      schemaVersion: activeVersion,
      wasUpcasted: activeVersion !== currentSchemaVersion,
      originalSchemaVersion: currentSchemaVersion,
    },
  };
}

export function upcastEventStream(events = []) {
  if (!Array.isArray(events)) {
    return [];
  }
  return events.map(upcastEvent);
}

export function getRegisteredUpcasters() {
  return Array.from(UPCASTERS.keys());
}

export function clearUpcasters() {
  UPCASTERS.clear();
}

export default {
  registerUpcaster,
  upcastEvent,
  upcastEventStream,
  getRegisteredUpcasters,
  clearUpcasters,
};
