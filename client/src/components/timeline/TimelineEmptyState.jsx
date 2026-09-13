import styles from './TimelineEmptyState.module.css';

/**
 * TimelineEmptyState
 * Shown when no events are found for a shipment or when awaiting search selection.
 */
export default function TimelineEmptyState({
  title = 'No Events Recorded',
  description = 'There are no ledger events recorded in the immutable stream for this shipment.',
  actionLabel,
  onAction,
}) {
  return (
    <div className={styles.container}>
      <div className={styles.iconCircle}>
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {actionLabel && onAction && (
        <button type="button" className={styles.actionBtn} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
