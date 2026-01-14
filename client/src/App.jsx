import React from "react"
import { Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login'
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Share from './pages/share';
import Starred from './pages/Starred';
import TrashFiles from './pages/TrashFiles';
import PublicView from './pages/PublicView';
import Recent from './pages/Recent'; // New Import

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/public/:token" element={<PublicView />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/folder/:folderId" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/share" element={<ProtectedRoute><Share /></ProtectedRoute>} />
      <Route path="/recent" element={<ProtectedRoute><Recent /></ProtectedRoute>} />
      <Route path="/starred" element={<ProtectedRoute><Starred /></ProtectedRoute>} />
      <Route path="/trash" element={<ProtectedRoute><TrashFiles /></ProtectedRoute>} />
    </Routes>
  );
}

export default App
