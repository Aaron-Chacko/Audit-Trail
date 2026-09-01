/**
 * components/layout/PageWrapper.jsx
 *
 * Shared layout shell used by every page.
 * Renders the Navbar and wraps page content in a centred <main> container.
 *
 * Usage:
 *   // In App.jsx route outlet — wraps all page components automatically.
 *   // Or use directly:
 *   <PageWrapper>
 *     <YourPageContent />
 *   </PageWrapper>
 */

import { NavLink } from 'react-router-dom';
import styles from './PageWrapper.module.css';

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function PageWrapper({ children }) {
  return (
    <>
      <header>
        <nav className={styles.navbar}>
          <NavLink to="/" className={styles.brand}>
            ⬡ Audit Trail
          </NavLink>

          <div className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/timeline"
              className={({ isActive }) =>
                isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
              }
            >
              Timeline
            </NavLink>
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        {children}
      </main>
    </>
  );
}
