/**
 * components/common/Loader.jsx
 *
 * Shared loading spinner shown while API calls are in-flight.
 *
 * Usage:
 *   <Loader />                    // Full-area centred spinner
 *   <Loader size="sm" />          // Small inline spinner
 *   <Loader label="Loading data" /> // Spinner + custom label
 */

import styles from './Loader.module.css';

/**
 * @param {{ size?: 'sm'|'md', label?: string }} props
 */
export default function Loader({ size = 'md', label = 'Loading…' }) {
  const spinnerClass =
    size === 'sm'
      ? `${styles.spinner} ${styles.spinnerSm}`
      : styles.spinner;

  if (size === 'sm') {
    // Inline spinner — no wrapper padding
    return <span className={spinnerClass} role="status" aria-label={label} />;
  }

  return (
    <div className={styles.wrapper} role="status">
      <span className={spinnerClass} />
      <span>{label}</span>
    </div>
  );
}
