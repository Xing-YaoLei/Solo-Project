import { Outlet } from '@tanstack/react-router'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
