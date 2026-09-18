import { formatEventType } from './formatters.js';

/**
 * utils/timeline-export.js
 * Exports the event ledger for a shipment as downloadable CSV or JSON files.
 */

/**
 * Download a string payload as a client-side file.
 *
 * @param {string} content
 * @param {string} fileName
 * @param {string} mimeType
 */
function downloadFile(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export event stream as formatted JSON file.
 *
 * @param {string} aggregateId
 * @param {Array} events
 */
export function exportTimelineJson(aggregateId, events) {
  if (!events || events.length === 0) return;
  const jsonStr = JSON.stringify(events, null, 2);
  downloadFile(jsonStr, `audit-trail-${aggregateId}.json`, 'application/json');
}

/**
 * Export event stream as CSV spreadsheet.
 *
 * @param {string} aggregateId
 * @param {Array} events
 */
export function exportTimelineCsv(aggregateId, events) {
  if (!events || events.length === 0) return;

  const headers = ['Version', 'Event Type', 'Label', 'Timestamp (ISO)', 'Location/Port', 'Temperature (°C)', 'Payload JSON'];
  const rows = events.map((e) => {
    const payload = e.payload || {};
    const port = payload.location?.port || payload.port || '';
    const temp = payload.temperature != null ? payload.temperature : '';
    const payloadEscaped = `"${JSON.stringify(payload).replace(/"/g, '""')}"`;
    const label = formatEventType(e.eventType);

    return [
      e.version,
      e.eventType,
      label,
      e.timestamp,
      `"${port}"`,
      temp,
      payloadEscaped,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadFile(csvContent, `audit-trail-${aggregateId}.csv`, 'text/csv;charset=utf-8;');
}
