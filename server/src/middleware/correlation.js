import { buildEventMetadata } from '../utils/metadata-builder.js';

export function correlationMiddleware(req, res, next) {
  const metadata = buildEventMetadata(req);

  req.correlationId = metadata.correlationId;
  req.causationId = metadata.causationId;
  req.auditContext = metadata;

  res.setHeader('X-Correlation-Id', metadata.correlationId);

  next();
}

export default correlationMiddleware;
