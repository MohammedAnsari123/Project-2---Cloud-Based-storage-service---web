import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, onSearch, searchQuery }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar (Fixed on Desktop, Drawer on Mobile) */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full lg:ml-64 transition-all duration-300 relative w-full">
                <Header
                    onSearch={onSearch}
                    searchQuery={searchQuery}
                    onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 w-full">
                    <div className="max-w-7xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
