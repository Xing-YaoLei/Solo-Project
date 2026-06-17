import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  AppstoreOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { UserRole } from '@/types'

export interface MenuItem {
  key: string
  icon: React.ReactNode
  label: string
  path: string
  allowedRoles?: UserRole[]
}

export const menuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
    path: '/dashboard',
  },
  {
    key: 'projects',
    icon: <ProjectOutlined />,
    label: '项目管理',
    path: '/projects',
  },
  {
    key: 'documents',
    icon: <FileTextOutlined />,
    label: '单据管理',
    path: '/documents',
  },
  {
    key: 'payments',
    icon: <MoneyCollectOutlined />,
    label: '款项管理',
    path: '/payments',
    allowedRoles: [UserRole.Owner, UserRole.Supervisor],
  },
  {
    key: 'materials',
    icon: <AppstoreOutlined />,
    label: '材料管理',
    path: '/materials',
    allowedRoles: [UserRole.Designer, UserRole.Foreman, UserRole.Supervisor],
  },
  {
    key: 'statistics',
    icon: <BarChartOutlined />,
    label: '统计分析',
    path: '/statistics',
    allowedRoles: [UserRole.Owner, UserRole.Supervisor],
  },
]

export const roleLabels: Record<UserRole, string> = {
  [UserRole.Owner]: '业主',
  [UserRole.Designer]: '设计师',
  [UserRole.Foreman]: '工长',
  [UserRole.Supervisor]: '监理',
}
