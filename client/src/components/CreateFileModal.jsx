import React, { useState } from 'react';
import { X, Save, FileText } from 'lucide-react';
import supabase from '../config/supabaseClient';
import { useAuth } from '../context/authContext';
import { saveFileMetadata } from '../services/folderApi';

const CreateFileModal = ({ isOpen, onClose, currentFolderId, onCreated }) => {
    const [fileName, setFileName] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!fileName.trim()) return alert("Filename is required");

        // Ensure .txt extension
        const finalName = fileName.endsWith('.txt') ? fileName : `${fileName}.txt`;

        try {
            setLoading(true);

            // 1. Create Blob
            const blob = new Blob([content], { type: 'text/plain' });
            const file = new File([blob], finalName, { type: 'text/plain' });

            // 2. Upload to Supabase (Need Authenticated Client)
            // The global 'supabase' client is anonymous. We must construct one with the user's token.
            const { createClient } = await import('@supabase/supabase-js');
            const authSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_KEY,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const { data: userData } = await authSupabase.auth.getUser(); // Token is already used in headers
            const userId = userData.user.id;

            // Sanitize filename
            const sanitizedName = finalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filePath = `${userId}/${Date.now()}_${sanitizedName}`;

            const { data, error } = await authSupabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (error) throw error;

            // 3. Save Metadata
            await saveFileMetadata(token, {
                name: finalName,
                size: blob.size,
                type: 'text/plain',
                url: data.path,
                parent_id: currentFolderId
            });

            onCreated();
            onClose();
            setFileName('');
            setContent('');

        } catch (error) {
            console.error(error);
            alert("Failed to create file: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex items-center gap-2 text-gray-700">
                        <FileText className="text-blue-600" />
                        <span className="font-semibold text-lg">Create New Text File</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="e.g., My Notes"
                                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                            <span className="text-gray-400 font-medium">.txt</span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-1 w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none bg-gray-50"
                            placeholder="Type your content here..."
                        ></textarea>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : <><Save size={18} /> Save File</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CreateFileModal;
