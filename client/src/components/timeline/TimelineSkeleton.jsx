import styles from './TimelineSkeleton.module.css';

/**
 * TimelineSkeleton
 * Animated loading placeholder for the chronological timeline feed.
 */
export default function TimelineSkeleton({ count = 4 }) {
  return (
    <div className={styles.container} aria-label="Loading timeline events">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={styles.item}>
          <div className={styles.nodeTrack}>
            <div className={styles.nodeDot} />
            {index < count - 1 && <div className={styles.nodeLine} />}
          </div>
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.badge} />
              <div className={styles.title} />
              <div className={styles.timestamp} />
            </div>
            <div className={styles.body}>
              <div className={styles.lineLong} />
              <div className={styles.lineShort} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
