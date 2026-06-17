import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import RoutePlanner from '@/pages/RoutePlanner';
import Trajectory from '@/pages/Trajectory';
import WorkOrders from '@/pages/WorkOrders';
import TodoPool from '@/pages/TodoPool';
import Reports from '@/pages/Reports';
import Permissions from '@/pages/Permissions';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/route-planner" element={<RoutePlanner />} />
          <Route path="/trajectory" element={<Trajectory />} />
          <Route path="/work-orders" element={<WorkOrders />} />
          <Route path="/todo-pool" element={<TodoPool />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/permissions" element={<Permissions />} />
        </Route>
      </Routes>
    </Router>
  );
}
