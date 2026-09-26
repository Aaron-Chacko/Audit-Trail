import { useState, useEffect, useRef } from 'react';
import anime from '@/utils/anime.js';
import StatusBadge from '@/components/common/StatusBadge.jsx';
import EventBadge from '@/components/common/EventBadge.jsx';
import StateDiffVisualizer from './StateDiffVisualizer.jsx';
import { formatTemperature, formatHumidity, formatWeight } from '@/utils/formatters.js';
import { formatEventTimestamp, formatRelativeTime } from '@/utils/date-helpers.js';
import styles from './ReconstructedStateCard.module.css';

/**
 * ReconstructedStateCard
 * Visualizes the point-in-time state of the aggregate as reconstructed by replaying
 * immutable events up to the selected scrubber version, with integrated mutation diffs and anime.js pulse.
 */
export default function ReconstructedStateCard({
  state,
  prevState = null,
  maxVersion,
  isHead = false,
  onResetToHead,
}) {
  const [showDiff, setShowDiff] = useState(true);
  const cardRef = useRef(null);

  // Smooth micro-pulse when state version changes
  useEffect(() => {
    if (cardRef.current && state?.version) {
      anime({
        targets: cardRef.current.querySelectorAll(`.${styles.fieldBox}`),
        opacity: [0.75, 1],
        scale: [0.99, 1],
        delay: anime.stagger(30),
        duration: 300,
        easing: 'easeOutQuad',
      });
    }
  }, [state?.version]);

  if (!state) return null;

  const lastEvent = state.lastEvent;

  return (
    <div ref={cardRef} className={`${styles.card} ${!isHead ? styles.historicalCard : ''}`}>
      {/* Card Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.reconstructedPill}>
            {isHead ? '● LIVE STATE (HEAD)' : '⏳ HISTORICAL STATE RECONSTRUCTION'}
          </span>
          <div className={styles.versionBadge}>
            Version #{state.version} <span className={styles.versionOf}>of {maxVersion}</span>
          </div>
          <StatusBadge status={state.status} />
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.diffToggleBtn}
            onClick={() => setShowDiff(!showDiff)}
            title="Toggle state mutation diff comparison"
          >
            {showDiff ? '▲ Hide State Diff' : '▼ Show State Diff'}
          </button>

          {!isHead && onResetToHead && (
            <button
              type="button"
              className={styles.resetHeadBtn}
              onClick={onResetToHead}
              title="Jump to live aggregate head"
            >
              ⚡ Return to Live (v{maxVersion})
            </button>
          )}
        </div>
      </div>

      {/* Replay Notice */}
      {!isHead && (
        <div className={styles.replayNotice}>
          <span>Reconstructed by replaying <strong>{state.eventsReplayed}</strong> historical {state.eventsReplayed === 1 ? 'event' : 'events'} up to version <strong>{state.version}</strong>.</span>
        </div>
      )}

      {/* Transition Trigger Banner */}
      {lastEvent && (
        <div className={styles.triggerBanner}>
          <span className={styles.triggerLabel}>Triggered by Event:</span>
          <EventBadge eventType={lastEvent.eventType} size="sm" />
          <span className={styles.triggerTimestamp}>
            ({formatEventTimestamp(lastEvent.timestamp)} — {formatRelativeTime(lastEvent.timestamp)})
          </span>
        </div>
      )}

      {/* State Properties Grid */}
      <div className={styles.grid}>
        {/* Route / Location */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Current Location</span>
          <span className={styles.fieldValuePrimary}>
            {state.currentLocation?.port || state.currentLocation || 'In Transit'}
            {state.currentLocation?.country ? `, ${state.currentLocation.country}` : ''}
          </span>
          <span className={styles.fieldSub}>
            Route: {state.origin?.port || 'Origin'} ➔ {state.destination?.port || 'Destination'}
          </span>
        </div>

        {/* Vessel & Logistics */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Vessel / Transport</span>
          <span className={styles.fieldValue}>
            {state.vessel?.name || 'Not assigned'}
          </span>
          {state.vessel?.imo && (
            <span className={styles.fieldSub}>IMO: {state.vessel.imo}</span>
          )}
        </div>

        {/* Cargo */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Cargo</span>
          <span className={styles.fieldValue}>
            {state.cargo?.description || 'General Cargo'}
          </span>
          {state.cargo?.weightKg != null && (
            <span className={styles.fieldSub}>{formatWeight(state.cargo.weightKg)}</span>
          )}
        </div>

        {/* Sensor State Snapshot */}
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Reconstructed Sensors</span>
          <div className={styles.sensorRow}>
            <span
              className={`
                ${styles.sensorItem}
                ${state.flags?.hasTemperatureSpike ? styles.sensorAlert : ''}
              `}
            >
              🌡️ {formatTemperature(state.sensorState?.temperature)}
            </span>
            <span
              className={`
                ${styles.sensorItem}
                ${state.flags?.hasHumidityAlert ? styles.sensorAlert : ''}
              `}
            >
              💧 {formatHumidity(state.sensorState?.humidity)}
            </span>
          </div>
          {state.flags?.customsHeld && (
            <span className={styles.customsAlert}>🛑 Customs Hold Active</span>
          )}
        </div>
      </div>

      {/* Integrated State Mutation Diff Visualizer (Phase 5) */}
      {showDiff && (
        <StateDiffVisualizer
          prevState={prevState}
          currState={state}
        />
      )}
    </div>
  );
}
