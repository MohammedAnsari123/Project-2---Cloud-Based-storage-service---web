import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getRecentFiles } from '../services/folderApi';
import Layout from '../components/Layout';
import { Clock, FileText, Download } from 'lucide-react';
import FileViewerModal from '../components/FileViewerModal';

const Recent = () => {
    const { token } = useAuth();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewerModal, setViewerModal] = useState({ isOpen: false, file: null });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getRecentFiles(token);
                setFiles(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-2">
                <Clock className="text-blue-600" size={28} />
                <h1 className="text-2xl font-bold text-gray-800">Recent Files</h1>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-500">Loading...</div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                <th className="p-4">Name</th>
                                <th className="p-4">Date Added</th>
                                <th className="p-4">Size</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {files.length > 0 ? files.map(file => (
                                <tr
                                    key={file.id}
                                    className="border-b border-gray-50 hover:bg-blue-50/50 transition-colors cursor-pointer group"
                                    onClick={() => setViewerModal({ isOpen: true, file })}
                                >
                                    <td className="p-4 flex items-center gap-3">
                                        <FileText size={20} className="text-blue-500" />
                                        <span className="font-medium text-gray-700">{file.name}</span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(file.created_at).toLocaleDateString()} {new Date(file.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</td>
                                    <td className="p-4 text-right">
                                        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 opacity-0 group-hover:opacity-100 transition-all">
                                            <Download size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-400">No recent files found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <FileViewerModal
                isOpen={viewerModal.isOpen}
                onClose={() => setViewerModal({ isOpen: false, file: null })}
                file={viewerModal.file}
            />
        </Layout>
    );
};

export default Recent;
