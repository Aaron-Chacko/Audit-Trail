import {
  SHIPMENT_CREATED,
  SHIPMENT_DEPARTED,
  SHIPMENT_ARRIVED,
  SHIPMENT_CANCELLED,
  SHIPMENT_STATUS_UPDATED,
  CONTAINER_CREATED,
  CONTAINER_LOADED,
  CONTAINER_UNLOADED,
  LOADED_ON_SHIP,
  TEMPERATURE_SPIKE,
  HUMIDITY_ALERT,
  SENSOR_READING,
  ARRIVED_AT_PORT,
  DEPARTED_FROM_PORT,
  CUSTOMS_CLEARED,
  CUSTOMS_HELD,
  ALERT_EVENT_TYPES,
  EVENT_TYPE_LABELS,
} from '@/constants/event-types.js';

/**
 * Event Categories
 */
export const EVENT_CATEGORIES = Object.freeze({
  LIFECYCLE: 'lifecycle',
  CONTAINER: 'container',
  SENSOR: 'sensor',
  PORT: 'port',
  CUSTOMS: 'customs',
  ALERT: 'alert',
});

/**
 * Theme configuration for each event type.
 * Defines icons, color tokens, and category assignments.
 */
export const EVENT_THEME_CONFIG = Object.freeze({
  [SHIPMENT_CREATED]: {
    category: EVENT_CATEGORIES.LIFECYCLE,
    icon: '✨',
    badgeVariant: 'accent',
    color: '#818cf8',
    bg: 'rgba(99, 102, 241, 0.12)',
    border: 'rgba(99, 102, 241, 0.35)',
    glow: 'rgba(99, 102, 241, 0.25)',
  },
  [SHIPMENT_DEPARTED]: {
    category: EVENT_CATEGORIES.LIFECYCLE,
    icon: '🚀',
    badgeVariant: 'info',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  [SHIPMENT_ARRIVED]: {
    category: EVENT_CATEGORIES.LIFECYCLE,
    icon: '🏁',
    badgeVariant: 'success',
    color: '#4ade80',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.35)',
    glow: 'rgba(34, 197, 94, 0.25)',
  },
  [SHIPMENT_CANCELLED]: {
    category: EVENT_CATEGORIES.LIFECYCLE,
    icon: '🚫',
    badgeVariant: 'danger',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.35)',
    glow: 'rgba(239, 68, 68, 0.3)',
  },
  [SHIPMENT_STATUS_UPDATED]: {
    category: EVENT_CATEGORIES.LIFECYCLE,
    icon: '🔄',
    badgeVariant: 'info',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.35)',
    glow: 'rgba(96, 165, 250, 0.2)',
  },
  [CONTAINER_CREATED]: {
    category: EVENT_CATEGORIES.CONTAINER,
    icon: '📦',
    badgeVariant: 'neutral',
    color: '#cbd5e1',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.35)',
    glow: 'rgba(148, 163, 184, 0.2)',
  },
  [CONTAINER_LOADED]: {
    category: EVENT_CATEGORIES.CONTAINER,
    icon: '🚢',
    badgeVariant: 'info',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  [CONTAINER_UNLOADED]: {
    category: EVENT_CATEGORIES.CONTAINER,
    icon: '🏗️',
    badgeVariant: 'success',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.35)',
    glow: 'rgba(52, 211, 153, 0.25)',
  },
  [LOADED_ON_SHIP]: {
    category: EVENT_CATEGORIES.CONTAINER,
    icon: '🚢',
    badgeVariant: 'info',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.35)',
    glow: 'rgba(56, 189, 248, 0.25)',
  },
  [TEMPERATURE_SPIKE]: {
    category: EVENT_CATEGORIES.ALERT,
    icon: '🔥',
    badgeVariant: 'danger',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.5)',
    glow: 'rgba(239, 68, 68, 0.45)',
  },
  [HUMIDITY_ALERT]: {
    category: EVENT_CATEGORIES.ALERT,
    icon: '💧',
    badgeVariant: 'warning',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.16)',
    border: 'rgba(245, 158, 11, 0.5)',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  [SENSOR_READING]: {
    category: EVENT_CATEGORIES.SENSOR,
    icon: '📊',
    badgeVariant: 'neutral',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
    glow: 'rgba(148, 163, 184, 0.15)',
  },
  [ARRIVED_AT_PORT]: {
    category: EVENT_CATEGORIES.PORT,
    icon: '⚓',
    badgeVariant: 'info',
    color: '#67e8f9',
    bg: 'rgba(103, 232, 249, 0.12)',
    border: 'rgba(103, 232, 249, 0.35)',
    glow: 'rgba(103, 232, 249, 0.25)',
  },
  [DEPARTED_FROM_PORT]: {
    category: EVENT_CATEGORIES.PORT,
    icon: '🌊',
    badgeVariant: 'info',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.35)',
    glow: 'rgba(96, 165, 250, 0.25)',
  },
  [CUSTOMS_CLEARED]: {
    category: EVENT_CATEGORIES.CUSTOMS,
    icon: '✅',
    badgeVariant: 'success',
    color: '#4ade80',
    bg: 'rgba(34, 197, 94, 0.12)',
    border: 'rgba(34, 197, 94, 0.35)',
    glow: 'rgba(34, 197, 94, 0.25)',
  },
  [CUSTOMS_HELD]: {
    category: EVENT_CATEGORIES.CUSTOMS,
    icon: '🛑',
    badgeVariant: 'danger',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.16)',
    border: 'rgba(239, 68, 68, 0.5)',
    glow: 'rgba(239, 68, 68, 0.45)',
  },
});

/**
 * Get theme styling and icon for any event type.
 * Falls back to neutral default if not recognized.
 *
 * @param {string} eventType
 * @returns {object}
 */
export function getEventTheme(eventType) {
  return (
    EVENT_THEME_CONFIG[eventType] ?? {
      category: EVENT_CATEGORIES.LIFECYCLE,
      icon: '📝',
      badgeVariant: 'neutral',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.3)',
      glow: 'rgba(148, 163, 184, 0.15)',
    }
  );
}

/**
 * Check whether an event type is an alert condition.
 *
 * @param {string} eventType
 * @returns {boolean}
 */
export function isAlertEvent(eventType) {
  return ALERT_EVENT_TYPES.includes(eventType);
}

/**
 * Get the category of an event type.
 *
 * @param {string} eventType
 * @returns {string}
 */
export function getEventCategory(eventType) {
  return getEventTheme(eventType).category;
}
