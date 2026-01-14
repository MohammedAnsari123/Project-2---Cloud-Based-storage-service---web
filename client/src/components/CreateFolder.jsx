import React, { useState } from 'react'
import { useAuth } from '../context/authContext';
import { createFolder } from '../services/folderApi';

const CreateFolder = ({ currentFolderId, onCreated }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false)
    const { token } = useAuth();

    const handleCreate = async () => {
        if (!name.trim()) {
            return;
        }

        if (!token) {
            alert("You must be logged in to create a folder");
            return;
        }

        try {
            setLoading(true);
            await createFolder(token, name, currentFolderId);
            setName("")
            if (onCreated) onCreated();
        } catch (error) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='my-5 border-y border-transparent py-2 flex flex-col sm:flex-row gap-2 w-full'>
            <input
                type="text"
                placeholder='New Folder name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='border border-gray-300 px-3 py-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto'
            />
            <button
                onClick={handleCreate}
                disabled={loading}
                className={`px-5 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${loading
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    }`}
            >
                {loading ? "Creating..." : "Create New Folder"}
            </button>
        </div>
    )
}

export default CreateFolder
