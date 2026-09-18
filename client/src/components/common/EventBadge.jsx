import { memo } from 'react';
import { formatEventType } from '@/utils/formatters.js';
import { getEventTheme, isAlertEvent } from '@/utils/event-theme.js';
import styles from './EventBadge.module.css';

/**
 * EventBadge
 * Renders a color-coded, icon-enriched badge for event types.
 */
function EventBadge({
  eventType,
  size = 'md',
  showIcon = true,
  customLabel,
  pulse = false,
}) {
  if (!eventType) return null;

  const theme = getEventTheme(eventType);
  const isAlert = isAlertEvent(eventType);
  const label = customLabel || formatEventType(eventType);

  const customStyle = {
    color: theme.color,
    backgroundColor: theme.bg,
    borderColor: theme.border,
    boxShadow: isAlert || pulse ? `0 0 10px ${theme.glow}` : undefined,
  };

  return (
    <span
      className={`
        ${styles.badge}
        ${styles[size] || styles.md}
        ${isAlert ? styles.alertBadge : ''}
        ${pulse ? styles.pulseBadge : ''}
      `}
      style={customStyle}
      title={`${eventType} (${theme.category})`}
    >
      {showIcon && <span className={styles.icon}>{theme.icon}</span>}
      <span className={styles.label}>{label}</span>
    </span>
  );
}

export default memo(EventBadge);
