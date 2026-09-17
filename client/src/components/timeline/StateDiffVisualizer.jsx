import { useMemo } from 'react';
import { computeStateDiff } from '@/utils/state-diff.js';
import styles from './StateDiffVisualizer.module.css';

/**
 * StateDiffVisualizer
 * Visualizes the explicit field mutations and state deltas applied
 * between version N-1 and version N.
 *
 * @param {object} props
 * @param {object|null} props.prevState - Reconstructed state at version N-1
 * @param {object} props.currState - Reconstructed state at version N
 */
export default function StateDiffVisualizer({ prevState, currState }) {
  const diff = useMemo(() => {
    return computeStateDiff(prevState, currState);
  }, [prevState, currState]);

  if (!currState) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.icon}>⚡</span>
        <h5 className={styles.title}>
          State Mutation Diff (v{prevState?.version ?? 0} ➔ v{currState.version})
        </h5>
        <span className={styles.badge}>
          {diff.isGenesis
            ? 'Genesis Initialization'
            : `${diff.changes.length} ${diff.changes.length === 1 ? 'Field Modified' : 'Fields Modified'}`}
        </span>
      </div>

      {diff.isGenesis ? (
        <div className={styles.genesisBanner}>
          <span className={styles.genesisDot} />
          <span>
            Genesis creation event. Initialized aggregate root for shipment <strong>{currState.aggregateId}</strong>.
          </span>
        </div>
      ) : diff.changes.length === 0 ? (
        <div className={styles.noChangeBanner}>
          <span>Routine sensor telemetry or metadata checkpoint — core aggregate attributes remained invariant.</span>
        </div>
      ) : (
        <div className={styles.diffList}>
          {diff.changes.map((change, idx) => (
            <div
              key={idx}
              className={`
                ${styles.diffRow}
                ${change.isAlert ? styles.alertRow : ''}
              `}
            >
              <div className={styles.fieldInfo}>
                <span className={styles.fieldName}>{change.field}</span>
                {change.delta && (
                  <span className={styles.deltaBadge}>{change.delta}</span>
                )}
              </div>

              <div className={styles.transitionTrack}>
                <div className={styles.prevVal} title="Previous value">
                  {change.prev || '—'}
                </div>
                <div className={styles.arrow}>➔</div>
                <div className={styles.currVal} title="Updated value">
                  {change.curr}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
