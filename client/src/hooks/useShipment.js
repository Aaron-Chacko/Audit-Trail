/**
 * hooks/useShipment.js
 *
 * Fetches and manages the CURRENT projected state of a single shipment.
 * Reads from the Read Model via getShipmentById().
 *
 * Usage:
 *   const { shipment, isLoading, error, refetch } = useShipment('SHIP-10042');
 */

import { useState, useEffect, useCallback } from 'react';
import { getShipmentById } from '@/api/shipments.js';

/**
 * @param {string|null} aggregateId - The shipment ID to fetch. Pass null to skip fetching.
 * @returns {{ shipment: object|null, isLoading: boolean, error: Error|null, refetch: Function }}
 */
export function useShipment(aggregateId) {
  const [shipment, setShipment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchShipment = useCallback(async () => {
    if (!aggregateId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getShipmentById(aggregateId);
      setShipment(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [aggregateId]);

  useEffect(() => {
    fetchShipment();
  }, [fetchShipment]);

  return { shipment, isLoading, error, refetch: fetchShipment };
}
