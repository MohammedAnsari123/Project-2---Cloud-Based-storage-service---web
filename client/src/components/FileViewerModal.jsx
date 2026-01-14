import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Image as ImageIcon, Loader, Edit2, Save } from 'lucide-react';
import { useAuth } from '../context/authContext';

const FileViewerModal = ({ isOpen, onClose, file }) => {
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [saving, setSaving] = useState(false);
    const { token, user } = useAuth();

    useEffect(() => {
        if (isOpen && file) {
            loadFileContent();
            setIsEditing(false);
        } else {
            setContent(null);
            setError(null);
        }
    }, [isOpen, file]);

    const getSignedUrl = async () => {
        if (!file) return null;
        try {
            const { createClient } = await import('@supabase/supabase-js');
            // We use the auth token from context if available, or just try public if not (but likely need auth)
            // Here we need to pass token prop or useAuth hook. Importing useAuth at top.
            // Assuming we can access token from context (already imported in previous step? No, let's check).
            // If not, we'll assume file is public OR we need to refactor.
            // Wait, FileViewerModal uses `useAuth`? Let's check imports. Yes, line 3.
            const authSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_KEY,
                { global: { headers: { Authorization: `Bearer ${token}` } } } // token from useAuth
            );
            const path = file.url.startsWith('/') ? file.url.slice(1) : file.url;
            const { data, error } = await authSupabase.storage.from('uploads').createSignedUrl(path, 3600); // 1 hour for preview
            if (error) return null;
            return data.signedUrl;
        } catch (e) {
            return null;
        }
    };

    const loadFileContent = async () => {
        // Try to get signed URL first
        const url = await getSignedUrl();
        if (!url) {
            setError("Could not access file. It might be private or deleted.");
            return;
        }

        if (file.type?.startsWith('image/')) {
            setContent(url);
            return;
        }

        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            try {
                setLoading(true);
                const response = await fetch(url);
                if (!response.ok) throw new Error("Failed to load content");
                const text = await response.text();
                setContent(text);
                setEditedContent(text);
            } catch (err) {
                console.error(err);
                setError("Could not load file content.");
            } finally {
                setLoading(false);
            }
        } else {
            setError("Preview not available for this file type.");
        }
    };

    const handleDownload = async () => {
        const url = await getSignedUrl();
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.name);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Failed to get download link");
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            // Dynamic import to avoid global issues, create auth client for this request
            const { createClient } = await import('@supabase/supabase-js');
            const authSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_KEY,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            const blob = new Blob([editedContent], { type: 'text/plain' });
            // Important: Use same filename to ensure we are updating the logic object if metadata matches
            const fileObj = new File([blob], file.name, { type: 'text/plain' });

            // file.url contains the path like "userId/timestamp_filename.txt"
            const { error } = await authSupabase.storage
                .from('uploads')
                .upload(file.url, fileObj, { upsert: true });

            if (error) throw error;

            setContent(editedContent);
            setIsEditing(false);
            // Optional: Add a small success indicator or toast here

        } catch (err) {
            console.error(err);
            alert("Failed to save changes: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !file) return null;

    const isTextFile = file.type === 'text/plain' || file.name.endsWith('.txt');
    // Check ownership: simple check if file path starts with user ID or checking owner_id from DB
    // Since we rely on RLS, the backend will reject if not owner anyway.
    // Visual check:
    const isOwner = user && file.owner_id === user.id;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50">
                    <div className="flex items-center gap-3">
                        {file.type?.startsWith('image/') ? <ImageIcon className="text-blue-500" /> : <FileText className="text-gray-500" />}
                        <div>
                            <h3 className="font-semibold text-gray-800 truncate max-w-md">{file.name}</h3>
                            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        {/* Edit Controls */}
                        {isTextFile && isOwner && !loading && !error && (
                            <>
                                {isEditing ? (
                                    <div className="flex items-center gap-2 mr-4 bg-white p-1 rounded-lg border shadow-sm">
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                setEditedContent(content); // Reset changes
                                            }}
                                            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                        >
                                            {saving ? 'Saving...' : <><Save size={14} /> Save</>}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition-colors mr-2"
                                        title="Edit File"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                )}
                            </>
                        )}

                        <button
                            onClick={handleDownload}
                            className="p-2 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                            title="Download"
                        >
                            <Download size={20} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4 min-h-[300px]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                            <Loader className="animate-spin" size={32} />
                            <span>Loading content...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center">
                            <p className="text-red-500 mb-2">{error}</p>
                            <a href={downloadUrl} className="text-blue-600 hover:underline">Download to view</a>
                        </div>
                    ) : (
                        <>
                            {file.type?.startsWith('image/') ? (
                                <img src={content} alt={file.name} className="max-w-full max-h-full object-contain shadow-lg rounded" />
                            ) : isTextFile ? (
                                isEditing ? (
                                    <textarea
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        className="w-full h-full p-8 rounded-lg shadow-sm border focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none bg-white text-gray-800 leading-relaxed"
                                        autoFocus
                                        spellCheck={false}
                                    />
                                ) : (
                                    <pre className="bg-white p-8 rounded-lg shadow-sm w-full h-full overflow-auto font-mono text-sm border whitespace-pre-wrap text-gray-800 leading-relaxed">
                                        {content}
                                    </pre>
                                )
                            ) : (
                                <div className="text-gray-500">No preview available</div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default FileViewerModal;
