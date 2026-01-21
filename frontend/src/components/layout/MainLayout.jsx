// frontend/src/components/layout/MainLayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed on left for desktop, overlay for mobile */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar - Fixed at top */}
        <Navbar toggleSidebar={toggleSidebar} />

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;