import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';

const Home = lazy(() => import('@/pages/Home'));
const TicketTypes = lazy(() => import('@/pages/TicketTypes'));
const SeatMap = lazy(() => import('@/pages/SeatMap'));
const Verification = lazy(() => import('@/pages/Verification'));
const RefundDispute = lazy(() => import('@/pages/RefundDispute'));
const DataSync = lazy(() => import('@/pages/DataSync'));

function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <Suspense fallback={<PageLoader />}>
                <Home />
              </Suspense>
            }
          />
          <Route
            path="/ticket-types"
            element={
              <Suspense fallback={<PageLoader />}>
                <TicketTypes />
              </Suspense>
            }
          />
          <Route
            path="/seat-map"
            element={
              <Suspense fallback={<PageLoader />}>
                <SeatMap />
              </Suspense>
            }
          />
          <Route
            path="/verification"
            element={
              <Suspense fallback={<PageLoader />}>
                <Verification />
              </Suspense>
            }
          />
          <Route
            path="/refund-dispute"
            element={
              <Suspense fallback={<PageLoader />}>
                <RefundDispute />
              </Suspense>
            }
          />
          <Route
            path="/data-sync"
            element={
              <Suspense fallback={<PageLoader />}>
                <DataSync />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
