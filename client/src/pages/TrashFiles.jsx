import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/authContext';
import supabase from '../config/supabaseClient';

const TrashFile = () => {
  const { token } = useAuth();
  const [deletedItems, setDeletedItems] = useState({ folders: [], files: [] });
  const [loading, setLoading] = useState(true);

  // Fetch Deleted Items
  const fetchTrash = async () => {
    try {
      setLoading(true);
      if (!token) return;

      const response = await fetch('https://project-2-cloud-based-storage-service-web.onrender.com/api/trash', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to fetch trash");

      const data = await response.json();
      setDeletedItems({ folders: data.folders, files: data.files });
    } catch (error) {
      console.error("Error fetching trash:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, [token]);

  // Restore Item
  const handleRestore = async (id, type) => {
    try {
      const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/trash/${type}/${id}/restore`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to restore");
      fetchTrash(); // Refresh
    } catch (error) {
      console.error("Restore failed:", error);
      alert("Failed to restore item");
    }
  };

  // Permanent Delete
  const handleDeleteForever = async (id, type) => {
    const confirmDelete = window.confirm("Are you sure? This cannot be undone.");
    if (!confirmDelete) return;

    try {
      const response = await fetch(`https://project-2-cloud-based-storage-service-web.onrender.com/api/trash/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Failed to delete");
      fetchTrash();
    } catch (error) {
      console.error("Delete forever failed:", error);
      alert("Failed to delete item permanently");
    }
  };

  // Helper to calculate days remaining
  const getRemainingDays = (deletedAt) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = Math.abs(now - deletedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const remaining = 30 - diffDays;
    return Math.max(0, remaining);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trash</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
          Items are permanently deleted after 30 days
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">Loading trash...</div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Folders in Trash */}
          <section>
            <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Folders</h3>
            {deletedItems.folders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {deletedItems.folders.map(folder => {
                  const daysLeft = getRemainingDays(folder.deleted_at);
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div key={folder.id} className="p-4 bg-white border border-gray-100 rounded-lg flex justify-between items-center group shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      {/* Retention Badge */}
                      <div className={`absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold rounded-bl-lg ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {daysLeft} days left
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-2xl opacity-80">📁</span>
                        <span className="font-medium text-gray-600 truncate max-w-[120px]" title={folder.name}>{folder.name}</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRestore(folder.id, 'folder')}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded-full transition-colors"
                          title="Restore"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDeleteForever(folder.id, 'folder')}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                          title="Delete Forever"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-gray-400 italic text-sm py-4 border-2 border-dashed border-gray-100 rounded-lg text-center">No folders in trash</div>}
          </section>

          {/* Files in Trash */}
          <section>
            <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Files</h3>
            {deletedItems.files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {deletedItems.files.map(file => {
                  const daysLeft = getRemainingDays(file.deleted_at);
                  const isUrgent = daysLeft <= 3;
                  return (
                    <div key={file.id} className="p-4 bg-white border border-gray-100 rounded-lg flex justify-between items-center group shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                      {/* Retention Badge */}
                      <div className={`absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold rounded-bl-lg ${isUrgent ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {daysLeft} days left
                      </div>

                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-2xl opacity-80">📄</span>
                        <span className="font-medium text-gray-600 truncate max-w-[120px]" title={file.name}>{file.name}</span>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleRestore(file.id, 'file')}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded-full transition-colors"
                          title="Restore"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => handleDeleteForever(file.id, 'file')}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                          title="Delete Forever"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <div className="text-gray-400 italic text-sm py-4 border-2 border-dashed border-gray-100 rounded-lg text-center">No files in trash</div>}
          </section>
        </div>
      )}
    </Layout>
  );
};

export default TrashFile;
