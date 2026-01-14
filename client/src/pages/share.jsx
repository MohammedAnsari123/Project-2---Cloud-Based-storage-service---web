import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/authContext';
import { getSharedWithMe } from '../services/folderApi';
import { FileText, Folder, Eye } from 'lucide-react';
import FileViewerModal from '../components/FileViewerModal';

const Share = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [sharedItems, setSharedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerModal, setViewerModal] = useState({ isOpen: false, file: null });

  useEffect(() => {
    const fetchShared = async () => {
      try {
        if (token) {
          const data = await getSharedWithMe(token);
          setSharedItems(data);
        }
      } catch (error) {
        console.error("Failed to fetch shared items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShared();
  }, [token]);

  const handleItemClick = (item) => {
    if (item.resource_type === 'folder') {
      // Navigate to Dashboard with folder context
      navigate(`/folder/${item.resource_id}`);
    } else {
      // Open File Viewer
      // Construct file object for viewer (needs url, name, type, id, owner_id?)
      // We enriched the share item with file details in backend, so it should have url.
      setViewerModal({ isOpen: true, file: item });
    }
  };

  return (
    <Layout>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Shared with me</h2>

      {loading ? (
        <div>Loading shared items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sharedItems.length > 0 ? (
            sharedItems.map(item => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {item.resource_type === 'folder' ? (
                    <Folder className="text-yellow-500" size={24} />
                  ) : (
                    <FileText className="text-blue-500" size={24} />
                  )}
                  <div className="font-medium truncate flex-1" title={item.name}>
                    {item.name}
                  </div>
                  {/* Preview Icon on Hover */}
                  <Eye size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Type: {item.resource_type}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${item.role === 'editor' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.role}
                    </span>
                  </div>
                  <div>Shared: {new Date(item.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 text-gray-400">
              No items have been shared with you yet.
            </div>
          )}
        </div>
      )}

      {/* File Viewer Modal */}
      {viewerModal.isOpen && (
        <FileViewerModal
          isOpen={viewerModal.isOpen}
          onClose={() => setViewerModal({ isOpen: false, file: null })}
          file={viewerModal.file}
        />
      )}
    </Layout>
  );
};

export default Share;
