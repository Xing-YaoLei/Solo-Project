import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SharePage from './pages/SharePage'

const App = () => {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/share/:token" element={<SharePage />} />
      </Routes>
    </div>
  )
}

export default App
