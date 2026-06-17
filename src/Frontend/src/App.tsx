import { Routes, Route, Navigate } from 'react-router-dom'
import DesktopLayout from '@/components/Layout/DesktopLayout'
import MobileLayout from '@/components/Layout/MobileLayout'
import OrderList from '@/pages/desktop/OrderList'
import OrderDetail from '@/pages/desktop/OrderDetail'
import Analysis from '@/pages/desktop/Analysis'
import OverdueList from '@/pages/desktop/OverdueList'
import TodoList from '@/pages/mobile/TodoList'
import TodoDetail from '@/pages/mobile/TodoDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/desktop/orders" replace />} />
      <Route path="/desktop" element={<DesktopLayout />}>
        <Route index element={<Navigate to="/desktop/orders" replace />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="analysis" element={<Analysis />} />
        <Route path="overdue" element={<OverdueList />} />
        <Route path="overdue/:id" element={<OverdueList />} />
      </Route>
      <Route path="/mobile" element={<MobileLayout />}>
        <Route index element={<TodoList />} />
        <Route path="todos/:id" element={<TodoDetail />} />
      </Route>
    </Routes>
  )
}

export default App
