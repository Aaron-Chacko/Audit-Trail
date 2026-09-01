/**
 * App.jsx
 *
 * Root Application component wiring React Router, PageWrapper layout,
 * and top-level route definitions.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PageWrapper from '@/components/layout/PageWrapper.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import Timeline from '@/pages/Timeline.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageWrapper>
    </BrowserRouter>
  );
}
