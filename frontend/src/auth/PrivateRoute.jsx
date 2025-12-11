import React from 'react'
import { Navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
  const db = sessionStorage.getItem('database_choice')
  
  if (!db) {
    return <Navigate to="/login" replace />
  }

  return children
}

export default PrivateRoute
