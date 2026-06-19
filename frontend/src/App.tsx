import { RouterProvider } from '@tanstack/react-router'
import { router } from './routes'
import { OperatorProvider } from '@/context/OperatorContext'

function App() {
  return (
    <OperatorProvider>
      <RouterProvider router={router} />
    </OperatorProvider>
  )
}

export default App
