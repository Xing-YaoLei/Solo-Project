import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom'
import HomePage from '@/pages/HomePage'
import TrainingPage from '@/pages/TrainingPage'
import RecordsPage from '@/pages/RecordsPage'
import ReplayPage from '@/pages/ReplayPage'
import ConfigPage from '@/pages/config/ConfigPage'
import ConfigQuestionsPage from '@/pages/config/ConfigQuestionsPage'
import ConfigAssetsPage from '@/pages/config/ConfigAssetsPage'
import ConfigRewardsPage from '@/pages/config/ConfigRewardsPage'
import ConfigSchedulePage from '@/pages/config/ConfigSchedulePage'
import ConfigModesPage from '@/pages/config/ConfigModesPage'

const ConfigLayout = () => {
  return (
    <Outlet />
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/training/:levelId',
    element: <TrainingPage />,
  },
  {
    path: '/records',
    element: <RecordsPage />,
  },
  {
    path: '/replay/:recordId',
    element: <ReplayPage />,
  },
  {
    path: '/config',
    element: <ConfigPage />,
    children: [
      {
        index: true,
        element: <ConfigLayout />,
      },
      {
        path: 'questions',
        element: <ConfigQuestionsPage />,
      },
      {
        path: 'assets',
        element: <ConfigAssetsPage />,
      },
      {
        path: 'rewards',
        element: <ConfigRewardsPage />,
      },
      {
        path: 'schedule',
        element: <ConfigSchedulePage />,
      },
      {
        path: 'modes',
        element: <ConfigModesPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])

export default router
