import React from 'react';
import { Search, User, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../context/authContext';

const Header = ({ onSearch, searchQuery, onToggleSidebar }) => {
    const { logout, user } = useAuth(); // Assuming useAuth provides user info

    return (
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">

            {/* Left: Hamburger & Search */}
            <div className="flex items-center gap-3 flex-1 max-w-2xl">
                <button
                    onClick={onToggleSidebar}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
                >
                    <Menu size={24} />
                </button>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm sm:text-base"
                        value={searchQuery}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Profile & Actions */}
            <div className="flex items-center gap-2 sm:gap-4 ml-4">
                {/* User Profile (Simple Placeholder) */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                        {/* Initials or User Icon */}
                        <User size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden md:block">
                        {user?.email || 'User'}
                    </span>
                </div>

                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

                <button
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors p-2 sm:p-0"
                    title="Logout"
                >
                    <LogOut size={18} />
                    <span className="text-sm hidden md:block">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
