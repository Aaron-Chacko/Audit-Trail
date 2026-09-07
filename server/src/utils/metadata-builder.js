import crypto from 'crypto';

export function buildEventMetadata(contextOrReq = {}, overrides = {}) {
  const isReq = contextOrReq && typeof contextOrReq === 'object' && ('headers' in contextOrReq || 'header' in contextOrReq);
  const headers = isReq ? (contextOrReq.headers || {}) : {};

  const causationId =
    overrides.causationId ||
    contextOrReq.causationId ||
    headers['x-causation-id'] ||
    headers['x-request-id'] ||
    crypto.randomUUID();

  const correlationId =
    overrides.correlationId ||
    contextOrReq.correlationId ||
    headers['x-correlation-id'] ||
    headers['x-trace-id'] ||
    causationId;

  const triggeredBy =
    overrides.triggeredBy ||
    contextOrReq.triggeredBy ||
    headers['x-user-id'] ||
    (contextOrReq.user && (contextOrReq.user.id || contextOrReq.user.username || contextOrReq.user.email)) ||
    'system';

  const clientIp =
    overrides.clientIp ||
    contextOrReq.clientIp ||
    (isReq ? (contextOrReq.ip || headers['x-forwarded-for'] || contextOrReq.socket?.remoteAddress || null) : null);

  const userAgent =
    overrides.userAgent ||
    contextOrReq.userAgent ||
    (isReq ? (headers['user-agent'] || null) : null);

  const rawOriginTs =
    overrides.originTimestamp ||
    contextOrReq.originTimestamp ||
    headers['x-request-timestamp'] ||
    null;

  const originTimestamp = rawOriginTs ? new Date(rawOriginTs) : new Date();

  const schemaVersion =
    typeof overrides.schemaVersion === 'number'
      ? overrides.schemaVersion
      : (typeof contextOrReq.schemaVersion === 'number' ? contextOrReq.schemaVersion : 1);

  return {
    causationId: String(causationId),
    correlationId: String(correlationId),
    triggeredBy: String(triggeredBy),
    clientIp: clientIp ? String(clientIp) : null,
    userAgent: userAgent ? String(userAgent) : null,
    originTimestamp,
    schemaVersion,
  };
}

export function createChildMetadata(parentEvent, overrides = {}) {
  if (!parentEvent || typeof parentEvent !== 'object') {
    return buildEventMetadata({}, overrides);
  }

  const parentMeta = parentEvent.metadata || {};
  const parentId =
    (parentEvent._id && parentEvent._id.toString()) ||
    parentEvent.id ||
    parentMeta.causationId ||
    crypto.randomUUID();

  const correlationId = overrides.correlationId || parentMeta.correlationId || crypto.randomUUID();

  return buildEventMetadata(
    {
      causationId: parentId,
      correlationId,
      triggeredBy: parentMeta.triggeredBy || 'system',
      clientIp: parentMeta.clientIp || null,
      userAgent: parentMeta.userAgent || null,
    },
    overrides
  );
}

export default {
  buildEventMetadata,
  createChildMetadata,
};
