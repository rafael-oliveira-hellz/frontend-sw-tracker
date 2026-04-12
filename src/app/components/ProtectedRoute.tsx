import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useData } from '../context/DataContext';

export default function ProtectedRoute() {
  const { userData, isInitializing } = useData();

  if (isInitializing) {
    return null;
  }

  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
