import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProductTags from './pages/ProductTags';
import SettlementSheets from './pages/SettlementSheets';
import GroupBatches from './pages/GroupBatches';
import ArrivalLists from './pages/ArrivalLists';
import LeaderTiers from './pages/LeaderTiers';
import ExceptionOrders from './pages/ExceptionOrders';
import ExportCenter from './pages/ExportCenter';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="product-tags" element={<ProductTags />} />
        <Route path="settlement-sheets" element={<SettlementSheets />} />
        <Route path="group-batches" element={<GroupBatches />} />
        <Route path="arrival-lists" element={<ArrivalLists />} />
        <Route path="leader-tiers" element={<LeaderTiers />} />
        <Route path="exception-orders" element={<ExceptionOrders />} />
        <Route path="export-center" element={<ExportCenter />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default App;
