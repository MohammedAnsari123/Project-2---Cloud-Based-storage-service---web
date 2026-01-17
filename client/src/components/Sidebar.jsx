import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Star, Trash2, Cloud, Clock } from 'lucide-react';
import { useAuth } from '../context/authContext';
import { getStorageUsage } from '../services/folderApi';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { token } = useAuth();
  const [storage, setStorage] = useState({ used: 0, total: 10 * 1024 * 1024 * 1024 });

  useEffect(() => {
    const fetchStorage = async () => {
      if (!token) return;
      try {
        const data = await getStorageUsage(token);
        setStorage({ used: data.usedBytes, total: data.totalBytes });
      } catch (error) {
        console.error("Failed to fetch storage:", error);
      }
    };
    fetchStorage();
  }, [token]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const percentage = Math.min(100, Math.max(0, (storage.used / storage.total) * 100));

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside
        className={`w-64 bg-white border-r h-screen flex flex-col fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <div className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <Cloud className="w-8 h-8 fill-current" />
            <span>Labmentix</span>
          </div>
          {/* Close Button on Mobile (Optional, backdrop works too) */}
          <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-gray-700">
            {/* Simple X icon via text or Lucide if needed, but clicking outside is standard */}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
          <Link
            to="/"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <LayoutDashboard size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">My Drive</span>
          </Link>

          <Link
            to="/recent"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group ${isActive('/recent') ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <Clock size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Recent</span>
          </Link>

          <Link
            to="/starred"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group ${isActive('/starred') ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <Star size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Starred</span>
          </Link>

          <Link
            to="/share"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group ${isActive('/share') ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <Users size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Shared with me</span>
          </Link>

          <Link
            to="/trash"
            onClick={() => window.innerWidth < 1024 && onClose()}
            className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-all group ${isActive('/trash') ? 'bg-blue-50 text-blue-600' : ''}`}
          >
            <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-medium">Trash</span>
          </Link>
        </nav>

        {/* Storage Usage (Dynamic) */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Storage</span>
            <span className="text-gray-500">{percentage.toFixed(0)}% used</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : 'bg-blue-600'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-xs text-gray-500">
            {formatBytes(storage.used)} of {formatBytes(storage.total)} used
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
