/**
 * components/common/ErrorMessage.jsx
 *
 * Shared error state display component.
 * Used whenever a hook returns an error — keeps error UI consistent
 * across Dashboard and Timeline without each page implementing its own.
 *
 * Usage:
 *   <ErrorMessage error={error} onRetry={refetch} />
 *   <ErrorMessage error={error} />  // No retry button
 */

import styles from './ErrorMessage.module.css';

/**
 * @param {{ error: Error|null, onRetry?: Function }} props
 */
export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;

  return (
    <div className={styles.box} role="alert">
      <p className={styles.title}>Something went wrong</p>
      <p className={styles.message}>{error.message}</p>
      {onRetry && (
        <button className={styles.retryBtn} onClick={onRetry} type="button">
          Try again
        </button>
      )}
    </div>
  );
}
