/**
 * hooks/useEventHistory.js
 *
 * Fetches the full event stream for a shipment and provides a
 * "scrubbed" view — the reconstructed state as of a given timestamp.
 *
 * Usage:
 *   const { events, isLoading, error } = useEventHistory('SHIP-10042');
 *
 * For historical state at a specific point in time (Timeline scrubber):
 *   const { historicalState, isLoadingHistory, fetchStateAt } = useHistoricalState('SHIP-10042');
 *   await fetchStateAt('2026-08-25T10:30:00Z');
 */

import { useState, useEffect, useCallback } from 'react';
import { getShipmentHistory, getShipmentStateAt } from '@/api/shipments.js';

/**
 * Fetches the complete event timeline for a shipment.
 *
 * @param {string|null} aggregateId
 * @returns {{ events: object[], isLoading: boolean, error: Error|null, refetch: Function }}
 */
export function useEventHistory(aggregateId) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!aggregateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getShipmentHistory(aggregateId);
      setEvents(data ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [aggregateId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { events, isLoading, error, refetch: fetchHistory };
}

/**
 * Provides on-demand historical state reconstruction.
 * Does NOT auto-fetch — call fetchStateAt(timestamp) to trigger.
 *
 * Designed for the Timeline scrubber: call fetchStateAt() on slider change.
 *
 * @param {string|null} aggregateId
 * @returns {{
 *   historicalState: object|null,
 *   isLoadingHistory: boolean,
 *   historyError: Error|null,
 *   fetchStateAt: (timestamp: string) => Promise<void>
 * }}
 */
export function useHistoricalState(aggregateId) {
  const [historicalState, setHistoricalState] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchStateAt = useCallback(
    async (timestamp) => {
      if (!aggregateId || !timestamp) return;

      setIsLoadingHistory(true);
      setHistoryError(null);

      try {
        const data = await getShipmentStateAt(aggregateId, timestamp);
        setHistoricalState(data);
      } catch (err) {
        setHistoryError(err);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [aggregateId]
  );

  return { historicalState, isLoadingHistory, historyError, fetchStateAt };
}
