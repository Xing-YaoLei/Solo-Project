import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { AppQueryProvider } from './providers/QueryProvider'
import { router } from './router.tsx'
import { useAuthStore } from './stores/authStore'
import './index.css'

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJVMDAzIiwicm9sZSI6ImF1ZGl0b3IiLCJleHAiOjE5Njc5MDAwMDB9.mocktoken';

const existingToken = localStorage.getItem('auth_token');
if (!existingToken) {
  localStorage.setItem('auth_token', MOCK_TOKEN);
}
useAuthStore.setState({ isAuthenticated: true, token: existingToken || MOCK_TOKEN });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppQueryProvider>
      <RouterProvider router={router} />
    </AppQueryProvider>
  </StrictMode>,
)
