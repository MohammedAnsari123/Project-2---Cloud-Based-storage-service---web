import React, { useState, useEffect } from 'react';
import { getFolders } from '../services/folderApi';
import { useAuth } from '../context/authContext';
import { Folder } from 'lucide-react';

const MoveModal = ({ isOpen, onClose, onMove, itemToMove, currentFolderId }) => {
    const { token } = useAuth();
    const [folders, setFolders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFolderId, setSelectedFolderId] = useState(null); // null means root
    const [history, setHistory] = useState([]); // Stack for navigation history

    useEffect(() => {
        if (isOpen) {
            // Reset state when opening
            setSelectedFolderId(null);
            setHistory([]);
            loadFolders(null);
        }
    }, [isOpen]);

    const loadFolders = async (parentId) => {
        setLoading(true);
        try {
            // We reuse getFolders. Note: Ideally we should filter out the item itself if it's a folder to prevent circular move
            // But getFolders just gets children.
            const data = await getFolders(token, parentId);
            setFolders(data || []);
        } catch (error) {
            console.error("Failed to load folders for move:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (folderId, folderName) => {
        setHistory([...history, { id: selectedFolderId, name: folderName || 'My Drive' }]); // Push current to history
        setSelectedFolderId(folderId);
        loadFolders(folderId);
    };

    const handleBack = () => {
        if (history.length === 0) return;
        const previous = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setSelectedFolderId(previous.id);
        loadFolders(previous.id);
    };

    const handleSubmit = () => {
        if (!itemToMove) return;
        // Don't allow moving to same folder
        if (selectedFolderId === currentFolderId) {
            alert("Item is already in this folder.");
            return;
        }
        onMove(itemToMove, selectedFolderId);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-gray-800">Move "{itemToMove?.name}"</h3>

                {/* Navigation Header */}
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {history.length > 0 ? (
                        <button onClick={handleBack} className="hover:bg-gray-200 p-1 rounded">⬅️</button>
                    ) : <span className="p-1 opacity-50">🏠</span>}
                    <span className="font-medium">
                        {selectedFolderId ? `Current: /...` : 'My Drive'}
                    </span>
                </div>

                {/* Folder List */}
                <div className="flex-1 overflow-y-auto space-y-2 border rounded-lg p-2 mb-4">
                    {loading ? (
                        <div className="text-center text-gray-400 py-4">Loading folders...</div>
                    ) : folders.length > 0 ? (
                        folders.map(folder => (
                            // Don't show the folder we are moving (can't move inside itself)
                            folder.id !== itemToMove.id && (
                                <div
                                    key={folder.id}
                                    className={`flex items-center justify-between p-3 rounded cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-100 ${selectedFolderId === folder.id ? 'bg-blue-50 border-blue-200' : ''}`}
                                    onClick={() => handleNavigate(folder.id, folder.name)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Folder className="text-yellow-500 w-5 h-5" />
                                        <span className="text-gray-700 truncate max-w-[200px]">{folder.name}</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">➡️</span>
                                </div>
                            )
                        ))
                    ) : (
                        <div className="text-center text-gray-400 py-10">No subfolders here</div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                    <div className="text-xs text-gray-500">
                        {selectedFolderId ? "Moving to selected folder" : "Moving to My Drive (Root)"}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 disabled:opacity-50"
                            disabled={loading}
                        >
                            Move Here
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MoveModal;
