import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import Classrooms from './pages/Classrooms'
import Students from './pages/Students'
import ScheduleBoard from './pages/ScheduleBoard'
import Conflicts from './pages/Conflicts'
import ConflictDetail from './pages/ConflictDetail'
import Approvals from './pages/Approvals'
import Transcripts from './pages/Transcripts'
import Applications from './pages/Applications'

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<div style={{ padding: 50, textAlign: 'center' }}>无权限访问</div>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="courses" element={<Courses />} />
        <Route path="classrooms" element={<Classrooms />} />
        <Route path="students" element={<Students />} />
        <Route path="schedule" element={<ScheduleBoard />} />
        <Route path="conflicts" element={<Conflicts />} />
        <Route path="conflicts/:id" element={<ConflictDetail />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="transcripts" element={<Transcripts />} />
        <Route path="applications" element={<Applications />} />
      </Route>
    </Routes>
  )
}

export default App
