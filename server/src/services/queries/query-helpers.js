/**
 * Pure helpers for shaping list-query results — sorting and pagination.
 * No DB calls, safe to unit test in isolation.
 */

// BUG-10 FIX: Restrict sortBy to known safe keys to prevent silent no-ops
// when callers pass a typo or unknown query param.
const ALLOWED_SORT_KEYS = new Set(['lastEventVersion', 'status', 'aggregateId', 'projectedAt']);

export function sortShipments(shipments, sortBy = 'lastEventVersion', order = 'desc') {
  // Fall back to 'lastEventVersion' for unknown/unsafe sort keys instead of silently no-oping
  const safeSortBy = ALLOWED_SORT_KEYS.has(sortBy) ? sortBy : 'lastEventVersion';

  const sorted = [...shipments].sort((a, b) => {
    const valA = a[safeSortBy];
    const valB = b[safeSortBy];
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function paginate(items, page = 1, limit = 20) {
  // BUG-11 FIX: Clamp limit to at least 1 to prevent divide-by-zero (Infinity in totalPages)
  const safeLimit = Math.max(1, Number(limit) || 20);
  const safePage  = Math.max(1, Number(page)  || 1);

  const start = (safePage - 1) * safeLimit;
  const end   = start + safeLimit;

  return {
    data: items.slice(start, end),
    page: safePage,
    limit: safeLimit,
    total: items.length,
    totalPages: Math.ceil(items.length / safeLimit),
  };
}