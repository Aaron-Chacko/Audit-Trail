/**
 * utils/state-diff.js
 *
 * Compares two aggregate state snapshots (Previous vs Current) to identify
 * field modifications, route changes, sensor deltas, and flag toggles.
 */

/**
 * Computes a structured diff between previous state and current state.
 *
 * @param {object|null} prevState - Reconstructed state at version N-1
 * @param {object} currState - Reconstructed state at version N
 * @returns {object} Structured diff object
 */
export function computeStateDiff(prevState, currState) {
  if (!currState) return { isGenesis: false, changes: [] };

  if (!prevState) {
    return {
      isGenesis: true,
      changes: [
        { field: 'Status', prev: null, curr: currState.status, type: 'init' },
        { field: 'Origin', prev: null, curr: currState.origin?.port || '—', type: 'init' },
        { field: 'Destination', prev: null, curr: currState.destination?.port || '—', type: 'init' },
        { field: 'Cargo', prev: null, curr: currState.cargo?.description || '—', type: 'init' },
      ],
    };
  }

  const changes = [];

  // 1. Status change
  if (prevState.status !== currState.status) {
    changes.push({
      field: 'Status',
      prev: prevState.status,
      curr: currState.status,
      type: 'status',
    });
  }

  // 2. Current Location change
  const prevPort = prevState.currentLocation?.port || prevState.currentLocation;
  const currPort = currState.currentLocation?.port || currState.currentLocation;
  if (prevPort !== currPort) {
    changes.push({
      field: 'Current Location',
      prev: prevPort || 'Origin',
      curr: currPort || '—',
      type: 'location',
    });
  }

  // 3. Vessel change
  const prevVessel = prevState.vessel?.name;
  const currVessel = currState.vessel?.name;
  if (prevVessel !== currVessel) {
    changes.push({
      field: 'Assigned Vessel',
      prev: prevVessel || 'Unassigned',
      curr: currVessel || '—',
      type: 'vessel',
    });
  }

  // 4. Temperature reading & delta
  const prevTemp = prevState.sensorState?.temperature;
  const currTemp = currState.sensorState?.temperature;
  if (prevTemp !== currTemp && currTemp != null) {
    const delta = prevTemp != null ? (currTemp - prevTemp).toFixed(1) : null;
    changes.push({
      field: 'Temperature',
      prev: prevTemp != null ? `${prevTemp}°C` : '—',
      curr: `${currTemp}°C`,
      delta: delta != null ? `${Number(delta) > 0 ? '+' : ''}${delta}°C` : null,
      type: 'sensor',
    });
  }

  // 5. Humidity reading
  const prevHum = prevState.sensorState?.humidity;
  const currHum = currState.sensorState?.humidity;
  if (prevHum !== currHum && currHum != null) {
    changes.push({
      field: 'Humidity',
      prev: prevHum != null ? `${prevHum}%` : '—',
      curr: `${currHum}%`,
      type: 'sensor',
    });
  }

  // 6. Flags: Temperature Spike
  if (prevState.flags?.hasTemperatureSpike !== currState.flags?.hasTemperatureSpike) {
    changes.push({
      field: 'Temperature Spike Alert',
      prev: prevState.flags?.hasTemperatureSpike ? 'Active' : 'Normal',
      curr: currState.flags?.hasTemperatureSpike ? 'Active ⚠️' : 'Normal',
      type: 'alert',
      isAlert: currState.flags?.hasTemperatureSpike,
    });
  }

  // 7. Flags: Customs Held
  if (prevState.flags?.customsHeld !== currState.flags?.customsHeld) {
    changes.push({
      field: 'Customs Hold',
      prev: prevState.flags?.customsHeld ? 'Held' : 'Clear',
      curr: currState.flags?.customsHeld ? 'Held 🔴' : 'Cleared ✅',
      type: 'customs',
      isAlert: currState.flags?.customsHeld,
    });
  }

  return {
    isGenesis: false,
    changes,
  };
}
