import React from 'react'
import Sidebar from '../components/Sidebar'
import Searchbar from '../components/Searchbar';
import { Outlet } from 'react-router-dom'

const MainLayout = () => {
  return (
    <div className='app-layout flex'>
      <Sidebar />
      <main className="flex-1 p-6">
        <Searchbar />
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout
