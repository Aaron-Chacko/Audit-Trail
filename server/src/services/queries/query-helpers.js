/**
 * Pure helpers for shaping list-query results — sorting and pagination.
 * No DB calls, safe to unit test in isolation.
 */

export function sortShipments(shipments, sortBy = 'lastEventVersion', order = 'desc') {
  const sorted = [...shipments].sort((a, b) => {
    const valA = a[sortBy];
    const valB = b[sortBy];
    if (valA < valB) return order === 'asc' ? -1 : 1;
    if (valA > valB) return order === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function paginate(items, page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const end = start + limit;
  return {
    data: items.slice(start, end),
    page,
    limit,
    total: items.length,
    totalPages: Math.ceil(items.length / limit),
  };
}