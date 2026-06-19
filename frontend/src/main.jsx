import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { Toaster } from 'react-hot-toast'
import './index.css'
import { routeTree } from './router/tree'

const router = createRouter({ routeTree })
const rootEl = document.getElementById('root')

if (rootEl) {
  const root = ReactDOM.createRoot(rootEl)
  root.render(
    React.createElement(
      React.StrictMode,
      null,
      React.createElement(RouterProvider, { router }),
      React.createElement(Toaster, {
        position: 'top-right',
        toastOptions: { duration: 3000, style: { borderRadius: '8px' } },
      })
    )
  )
}
