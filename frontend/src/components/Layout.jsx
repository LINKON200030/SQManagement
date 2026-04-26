import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <div className="print:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="print:hidden">
          <TopNavbar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
