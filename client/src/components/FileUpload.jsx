import React, { useState } from 'react';
import supabase from '../config/supabaseClient';
import { useAuth } from '../context/authContext';
import { saveFileMetadata } from '../services/folderApi';

// Initialized in config/supabaseClient.js

const FileUpload = ({ currentFolderId, onUploadSuccess }) => {
    const [uploading, setUploading] = useState(false);
    const { token } = useAuth(); // We need token for metadata save

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);

            // 1. Upload to Supabase Storage (Authenticated)
            const { createClient } = await import('@supabase/supabase-js');
            const authSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_KEY,
                { global: { headers: { Authorization: `Bearer ${token}` } } }
            );

            // Fetch user (this verifies token valid too)
            const { data: userData, error: userError } = await authSupabase.auth.getUser();
            if (userError) throw userError;

            const userId = userData.user.id;
            // Sanitize filename: remove special chars, spaces to underscores
            const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const filePath = `${userId}/${Date.now()}_${sanitizedName}`;

            const { data, error } = await authSupabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (error) throw error;

            // 2. Save Metadata to Backend
            await saveFileMetadata(token, {
                name: file.name,
                size: file.size,
                type: file.type,
                url: data.path, // Store the storage path
                parent_id: currentFolderId
            });

            if (onUploadSuccess) onUploadSuccess();
            alert("Upload successful!");

        } catch (error) {
            console.error(error);
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
            e.target.value = null; // Reset input
        }
    };

    return (
        <div>
            <label className={`cursor-pointer flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors ${uploading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
                <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </label>
        </div>
    );
};

export default FileUpload;