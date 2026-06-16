import { Routes, Route, Navigate } from 'react-router-dom'
import { useUserStore } from '@/store/user'
import Login from '@/pages/Login'
import MainLayout from '@/components/MainLayout'
import Dashboard from '@/pages/Dashboard'
import PrescriptionList from '@/pages/prescription/List'
import PrescriptionDetail from '@/pages/prescription/Detail'
import RestockOrders from '@/pages/RestockOrders'
import InsuranceRecords from '@/pages/InsuranceRecords'
import Statistics from '@/pages/Statistics'
import Users from '@/pages/Users'
import Stores from '@/pages/Stores'

function App() {
  const { token } = useUserStore()

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/prescriptions" element={<PrescriptionList />} />
        <Route path="/prescriptions/:id" element={<PrescriptionDetail />} />
        <Route path="/restock-orders" element={<RestockOrders />} />
        <Route path="/insurance-records" element={<InsuranceRecords />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/users" element={<Users />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  )
}

export default App
