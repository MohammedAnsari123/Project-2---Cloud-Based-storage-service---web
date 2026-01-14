import React, { useState, useEffect, useCallback } from 'react'
import CreateFolder from '../components/CreateFolder'
import FileUpload from '../components/FileUpload'
import Breadcrumb from '../components/Breadcrumb'
import {
  getFolders,
  getBreadcrumbs,
  getFiles,
  renameFolder,
  deleteFolder,
  renameFile,
  deleteFile,
  shareResource,
  searchResources,
  moveFolder,
  moveFile,
  toggleStar
} from '../services/folderApi'
import { useAuth } from '../context/authContext'
import Layout from '../components/Layout'
import ShareModal from '../components/ShareModal'
import { ConfirmModal, InputModal } from '../components/Modals'
import MoveModal from '../components/MoveModal'
import CreateFileModal from '../components/CreateFileModal'
import FileViewerModal from '../components/FileViewerModal' // New Import
import { useNavigate, useLocation, useParams } from 'react-router-dom' // Added useParams

import { Folder, MoreVertical, FileText, Download, Share2, MoveRight, Edit2, Trash2, Search, Star, FilePlus, LayoutList, LayoutGrid, ArrowUpDown } from 'lucide-react'

const Dashboard = () => {
  const { token, loading: authLoading } = useAuth();
  const { folderId } = useParams(); // Get folderId from URL
  const location = useLocation();
  const navigate = useNavigate();

  // --- State Management ---
  // If URL has folderId, use it, else null (Root)
  const [currentFolderId, setCurrentFolderId] = useState(folderId || null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);

  // Sync URL params with State
  useEffect(() => {
    setCurrentFolderId(folderId || null);
  }, [folderId]);

  // Remove location.state effect as we use URL now

  // Data State
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState({ folders: false, files: false });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ folders: [], files: [] });
  const [isSearching, setIsSearching] = useState(false);

  // View & Sort State
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'size'

  // Modal States
  const [shareModal, setShareModal] = useState({ isOpen: false, item: null, type: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, isDangerous: false });
  const [inputModal, setInputModal] = useState({ isOpen: false, title: '', initialValue: '', onSubmit: () => { } });
  const [moveModal, setMoveModal] = useState({ isOpen: false, item: null, type: '' });
  const [createFileModal, setCreateFileModal] = useState(false);
  const [viewerModal, setViewerModal] = useState({ isOpen: false, file: null });

  // --- Data Fetching ---

  const refreshData = useCallback(() => {
    fetchFolders();
    fetchFiles();
  }, [token, currentFolderId]);

  const fetchFolders = async () => {
    if (!token) return;
    setIsLoading(prev => ({ ...prev, folders: true }));
    try {
      const data = await getFolders(token, currentFolderId);
      setFolders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch folders error:", err);
      setFolders([]);
    } finally {
      setIsLoading(prev => ({ ...prev, folders: false }));
    }
  };

  const fetchFiles = async () => {
    if (!token) return;
    setIsLoading(prev => ({ ...prev, files: true }));
    try {
      const data = await getFiles(token, currentFolderId);
      setFiles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch files error:", err);
      setFiles([]);
    } finally {
      setIsLoading(prev => ({ ...prev, files: false }));
    }
  };

  const fetchBreadcrumbPath = async () => {
    if (!token || !currentFolderId) {
      setBreadcrumbs([]);
      return;
    }
    try {
      const data = await getBreadcrumbs(token, currentFolderId);
      setBreadcrumbs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch breadcrumbs error:", err);
      setBreadcrumbs([]);
    }
  };

  useEffect(() => {
    if (!authLoading && token) {
      refreshData();
      fetchBreadcrumbPath();
    }
  }, [token, currentFolderId, authLoading]);


  // --- Action Handlers ---

  // Search
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults({ folders: [], files: [] });
      return;
    }
    performSearch(query);
  };

  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      const data = await searchResources(token, query);
      setSearchResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Share
  const triggerShare = (e, item, type) => {
    e.stopPropagation();
    setShareModal({ isOpen: true, item, type });
  };

  const handleShareSubmit = async (email, role) => {
    try {
      if (!email) throw new Error("Email is required");
      const { item, type } = shareModal;
      await shareResource(token, email, item.id, type, role);
      alert(`Shared ${item.name} with ${email} as ${role}`);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const handleGetLink = async (expiresAt, password) => {
    try {
      const data = await createPublicLink(token, shareModal.item.id, shareModal.type, expiresAt, password);
      // Return full URL
      return `${window.location.origin}/public/${data.token}`;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  // Rename
  const triggerRename = (e, item, type) => {
    e.stopPropagation();
    setInputModal({
      isOpen: true,
      title: `Rename ${type === 'folder' ? 'Folder' : 'File'}`,
      initialValue: item.name,
      onSubmit: async (newName) => {
        if (!newName || newName === item.name) return;
        try {
          if (type === 'folder') {
            await renameFolder(token, item.id, newName);
          } else {
            await renameFile(token, item.id, newName);
          }
          refreshData();
        } catch (error) {
          console.error("Rename failed:", error);
          alert("Failed to rename item.");
        }
      }
    });
  };

  // Delete
  const triggerDelete = (e, item, type) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: `Delete ${type === 'folder' ? 'Folder' : 'File'}`,
      message: `Are you sure you want to move "${item.name}" to trash?`,
      isDangerous: true,
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          if (type === 'folder') {
            await deleteFolder(token, item.id);
          } else {
            await deleteFile(token, item.id);
          }
          refreshData();
        } catch (error) {
          console.error("Delete failed:", error);
          alert("Failed to delete item.");
        }
      }
    });
  };

  // Move
  const triggerMove = (e, item, type) => {
    e.stopPropagation();
    setMoveModal({ isOpen: true, item, type });
  };

  const handleMoveSubmit = async (item, targetFolderId) => {
    try {
      if (moveModal.type === 'folder') {
        await moveFolder(token, item.id, targetFolderId);
      } else {
        await moveFile(token, item.id, targetFolderId);
      }
      refreshData();
    } catch (error) {
      console.error("Move failed:", error);
      alert(error.message || "Failed to move item.");
    }
  };

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState(null); // { item, type }
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  // --- Handlers ---

  const handleDragStart = (e, item, type) => {
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
    // Ghost image is handled by browser usually
  };

  const handleDragOver = (e, folderId) => {
    e.preventDefault();
    if (draggedItem && draggedItem.item.id !== folderId) {
      setDragOverFolderId(folderId);
    }
  };

  const handleDragLeave = (e) => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e, targetFolderId) => {
    e.preventDefault();
    setDragOverFolderId(null);

    if (!draggedItem || draggedItem.item.id === targetFolderId) return;

    try {
      if (draggedItem.type === 'folder') {
        await moveFolder(token, draggedItem.item.id, targetFolderId);
      } else {
        await moveFile(token, draggedItem.item.id, targetFolderId);
      }
      refreshData();
    } catch (error) {
      console.error("Drop failed:", error);
      alert("Failed to move item.");
    }
    setDraggedItem(null);
  };

  const handleStar = async (e, item, type) => {
    e.stopPropagation();
    try {
      await toggleStar(token, item.id, type);
      // Optional: Add visual feedback (turn star yellow instantly or toast)
      // For now simple alert
      alert("Favorites updated!");
    } catch (error) {
      console.error("Star failed:", error);
    }
  };


  // --- Sorting & Helpers ---

  const getSortedItems = (items) => {
    return [...items].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
      // Default: Date (Newest first)
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  };

  // --- Render Helpers ---

  const renderActionButtons = (item, type) => (
    <div className="flex gap-1">
      <button onClick={(e) => handleStar(e, item, type)} className="p-1.5 hover:bg-white hover:text-yellow-500 rounded-md text-gray-400 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Star">
        <Star size={16} fill={item.is_starred ? "currentColor" : "none"} />
      </button>
      <button onClick={(e) => triggerShare(e, item, type)} className="p-1.5 hover:bg-white hover:text-gray-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Share">
        <Share2 size={16} />
      </button>
      {type === 'folder' && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const res = await fetch(`http://localhost:5000/api/download/folder/${item.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) throw new Error("Download failed");

              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${item.name}.zip`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
            } catch (err) {
              console.error(err);
              alert("Folder download failed");
            }
          }}
          className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Download Zip"
        >
          <Download size={16} />
        </button>
      )}
      <button onClick={(e) => triggerMove(e, item, type)} className="p-1.5 hover:bg-white hover:text-purple-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Move">
        <MoveRight size={16} />
      </button>
      <button onClick={(e) => triggerRename(e, item, type)} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Rename">
        <Edit2 size={16} />
      </button>
      <button onClick={(e) => triggerDelete(e, item, type)} className="p-1.5 hover:bg-white hover:text-red-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Delete">
        <Trash2 size={16} />
      </button>
    </div>
  );

  if (authLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <Layout onSearch={handleSearchChange} searchQuery={searchQuery}>
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 w-full">
        <Breadcrumb path={breadcrumbs} onNavigate={setCurrentFolderId} user={useAuth().user} />

        {/* Actions Group - Stack on mobile, Row on desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <CreateFolder currentFolderId={currentFolderId} onCreated={refreshData} />

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setCreateFileModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              <FilePlus size={18} />
              <span>New Text File</span>
            </button>
            <div className="flex-1 sm:flex-none">
              <FileUpload currentFolderId={currentFolderId} onUploadSuccess={refreshData} />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Sort & View */}
      <div className="flex justify-between items-center mb-4 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:inline">Sort by:</span>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-white border px-3 py-1.5 rounded-lg hover:bg-gray-50">
              <ArrowUpDown size={14} />
              {sortBy === 'date' ? 'Date' : sortBy === 'name' ? 'Name' : 'Size'}
            </button>
            <div className="absolute top-full left-0 mt-1 w-32 bg-white border rounded-lg shadow-lg hidden group-hover:block z-10">
              <button onClick={() => setSortBy('date')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Date</button>
              <button onClick={() => setSortBy('name')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Name</button>
              <button onClick={() => setSortBy('size')} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50">Size</button>
            </div>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="Grid View"
          >
            <LayoutGrid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            title="List View"
          >
            <LayoutList size={18} />
          </button>
        </div>
      </div>

      {searchQuery ? (
        // --- Search Results View ---
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <Search size={20} />
            Results for "{searchQuery}"
          </h2>
          {isSearching ? (
            <div className="text-gray-500 py-8 text-center">Searching...</div>
          ) : (
            <>
              {/* Folder Results */}
              {searchResults.folders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Folders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.folders.map(folder => (
                      <div key={folder.id}
                        className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md cursor-pointer flex items-center gap-3 transition-all"
                        onClick={() => { setCurrentFolderId(folder.id); setSearchQuery(''); }}
                      >
                        <Folder className="text-yellow-500 fill-current" size={24} />
                        <span className="font-medium text-gray-700 truncate">{folder.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Results */}
              {searchResults.files.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {searchResults.files.map(file => (
                      <div key={file.id}
                        className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="text-blue-500" size={24} />
                          <span className="font-medium text-gray-700 truncate">{file.name}</span>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const { createClient } = await import('@supabase/supabase-js');
                              const authSupabase = createClient(
                                import.meta.env.VITE_SUPABASE_URL,
                                import.meta.env.VITE_SUPABASE_KEY,
                                { global: { headers: { Authorization: `Bearer ${token}` } } }
                              );
                              const path = file.url.startsWith('/') ? file.url.slice(1) : file.url;
                              const { data, error } = await authSupabase.storage.from('uploads').createSignedUrl(path, 60, { download: file.name });
                              if (error) throw error;
                              const link = document.createElement('a');
                              link.href = data.signedUrl;
                              link.setAttribute('download', file.name);
                              document.body.appendChild(link); link.click(); document.body.removeChild(link);
                            } catch (err) { alert("Download failed"); }
                          }}
                          className="text-blue-600 hover:bg-blue-50 p-2 rounded-full"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.folders.length === 0 && searchResults.files.length === 0 && (
                <div className="text-center py-10 text-gray-400">No results found</div>
              )}
            </>
          )}
        </div>
      ) : (
        // --- Normal Dashboard View ---
        <div className="space-y-8 animate-in fade-in duration-300">

          {/* Folders Section */}
          <section>
            <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider flex items-center justify-between">
              Folders
              {isLoading.folders && <span className="text-blue-500 text-[10px] animate-pulse">Updating...</span>}
            </h3>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "flex flex-col gap-2"}>
              {getSortedItems(folders).map(folder => (
                <div
                  key={folder.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, folder, 'folder')}
                  onDragOver={(e) => handleDragOver(e, folder.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className={`group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer transition-all overflow-hidden ${viewMode === 'list' ? 'flex items-center justify-between p-3' : 'flex flex-col'} ${dragOverFolderId === folder.id ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-300 transform scale-105 z-10' : ''}`}
                  onClick={() => navigate(`/folder/${folder.id}`)}
                >
                  <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1' : 'p-4'}`}>
                    <Folder className="text-yellow-500 fill-yellow-500/20 flex-shrink-0" size={viewMode === 'list' ? 24 : 32} strokeWidth={1.5} />
                    <div className="font-medium text-gray-800 truncate" title={folder.name}>
                      {folder.name}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={`${viewMode === 'list' ? '' : 'bg-gray-50 border-t border-gray-100 p-2 flex justify-end gap-1'}`} onClick={(e) => e.stopPropagation()}>
                    {renderActionButtons(folder, 'folder')}
                  </div>
                </div>
              ))}

              {!isLoading.folders && folders.length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                  No folders here
                </div>
              )}
            </div>
          </section>

          {/* Files Section */}
          <section>
            <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider flex items-center justify-between">
              Files
              {isLoading.files && <span className="text-blue-500 text-[10px] animate-pulse">Updating...</span>}
            </h3>

            <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "flex flex-col gap-2"}>
              {getSortedItems(files).map(file => (
                <div
                  key={file.id}
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, file, 'file')}
                  className={`group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md cursor-pointer transition-all overflow-hidden ${viewMode === 'list' ? 'flex items-center justify-between p-3' : 'flex flex-col'}`}
                  onClick={() => setViewerModal({ isOpen: true, file })}
                >
                  {/* Thumbnail / Icon */}
                  <div className={`${viewMode === 'list' ? 'flex items-center gap-3 flex-1' : 'h-32 bg-gray-50 flex items-center justify-center border-b border-gray-50 relative overflow-hidden'}`}>
                    {viewMode === 'grid' ? (
                      file.type?.startsWith('image/') ? (
                        <img
                          src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/uploads/${file.url}`}
                          alt={file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <FileText className="text-gray-400 w-12 h-12" strokeWidth={1} />
                      )
                    ) : (
                      // List View Icon
                      <FileText className="text-blue-500 flex-shrink-0" size={24} />
                    )}

                    {viewMode === 'list' && <span className="font-medium text-gray-700 truncate">{file.name}</span>}
                  </div>

                  {/* File Info / Actions */}
                  <div className={viewMode === 'list' ? 'flex items-center gap-4' : 'p-3'}>
                    {viewMode === 'grid' && (
                      <>
                        <div className="font-medium text-sm text-gray-700 truncate mb-1" title={file.name}>
                          {file.name}
                        </div>
                        <div className="flex justify-between items-end text-[10px] text-gray-400 font-medium mb-2">
                          <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </>
                    )}

                    {/* Static Actions Footer */}
                    <div className={`${viewMode === 'list' ? 'flex gap-1' : 'bg-gray-50 border-t border-gray-100 p-2 flex justify-end gap-1'}`} onClick={(e) => e.stopPropagation()}>
                      {/* Download Button */}
                      <button
                        className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const { createClient } = await import('@supabase/supabase-js');
                            const authSupabase = createClient(
                              import.meta.env.VITE_SUPABASE_URL,
                              import.meta.env.VITE_SUPABASE_KEY,
                              { global: { headers: { Authorization: `Bearer ${token}` } } }
                            );
                            const path = file.url.startsWith('/') ? file.url.slice(1) : file.url;
                            const { data, error } = await authSupabase.storage.from('uploads').createSignedUrl(path, 60, { download: file.name });
                            if (error) throw error;

                            const link = document.createElement('a');
                            link.href = data.signedUrl;
                            link.setAttribute('download', file.name);
                            document.body.appendChild(link); link.click(); document.body.removeChild(link);
                          } catch (err) { alert("Download failed"); }
                        }}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>

                      {/* Mapped Actions */}
                      <button onClick={(e) => handleStar(e, file, 'file')} className="p-1.5 hover:bg-white hover:text-yellow-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Star">
                        <Star size={16} className={file.is_starred ? "fill-yellow-400 text-yellow-400" : ""} />
                      </button>
                      <button onClick={(e) => triggerShare(e, file, 'file')} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Share"><Share2 size={16} /></button>
                      <button onClick={(e) => triggerMove(e, file, 'file')} className="p-1.5 hover:bg-white hover:text-purple-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Move"><MoveRight size={16} /></button>
                      <button onClick={(e) => triggerRename(e, file, 'file')} className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Rename"><Edit2 size={16} /></button>
                      <button onClick={(e) => triggerDelete(e, file, 'file')} className="p-1.5 hover:bg-white hover:text-red-600 rounded-md text-gray-500 transition-colors border border-transparent hover:border-gray-200 hover:shadow-sm" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
              {!isLoading.files && files.length === 0 && (
                <div className="col-span-full py-8 text-center border-2 border-dashed border-gray-100 rounded-xl text-gray-400">
                  No files here
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* --- Modals --- */}

      <ShareModal
        isOpen={shareModal.isOpen}
        onClose={() => setShareModal({ ...shareModal, isOpen: false })}
        onShare={handleShareSubmit}
        onGetLink={handleGetLink}
        resourceName={shareModal.item?.name}
        resourceId={shareModal.item?.id}
        resourceType={shareModal.type}
        token={token}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isDangerous={confirmModal.isDangerous}
      />

      <InputModal
        isOpen={inputModal.isOpen}
        onClose={() => setInputModal({ ...inputModal, isOpen: false })}
        onSubmit={inputModal.onSubmit}
        title={inputModal.title}
        initialValue={inputModal.initialValue}
      />

      <MoveModal
        isOpen={moveModal.isOpen}
        onClose={() => setMoveModal({ ...moveModal, isOpen: false })}
        itemToMove={moveModal.item}
        currentFolderId={currentFolderId}
        onMove={handleMoveSubmit}
      />

      <CreateFileModal
        isOpen={createFileModal}
        onClose={() => setCreateFileModal(false)}
        currentFolderId={currentFolderId}
        onCreated={refreshData}
      />

      <FileViewerModal
        isOpen={viewerModal.isOpen}
        onClose={() => setViewerModal({ ...viewerModal, isOpen: false })}
        file={viewerModal.file}
      />

    </Layout>
  )
}

export default Dashboard
