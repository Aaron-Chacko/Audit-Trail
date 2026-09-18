import { useEffect } from 'react';
import styles from './TimelineShortcutsModal.module.css';

/**
 * TimelineShortcutsModal
 * Interactive modal listing all keyboard navigation shortcuts for power-users.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 */
export default function TimelineShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: '←', label: 'Step Backward', desc: 'Rewind state by 1 event version' },
    { key: '→', label: 'Step Forward', desc: 'Advance state by 1 event version' },
    { key: 'Space', label: 'Play / Pause', desc: 'Toggle automated stream replay simulation' },
    { key: 'ESC', label: 'Close Modal', desc: 'Dismiss active inspector or shortcut drawer' },
    { key: '?', label: 'Shortcuts Help', desc: 'Open this keyboard shortcuts reference guide' },
  ];

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <span className={styles.icon}>⌨️</span>
            <h4 className={styles.title}>Timeline Keyboard Shortcuts</h4>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <p className={styles.intro}>
            Navigate and control the historical event stream using quick keyboard commands:
          </p>

          <div className={styles.list}>
            {shortcuts.map((s, idx) => (
              <div key={idx} className={styles.row}>
                <div className={styles.keyWrapper}>
                  <kbd className={styles.key}>{s.key}</kbd>
                  <span className={styles.label}>{s.label}</span>
                </div>
                <span className={styles.desc}>{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.gotItBtn} onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
