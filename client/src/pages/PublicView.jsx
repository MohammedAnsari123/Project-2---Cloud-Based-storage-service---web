import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicResource, getPublicContents } from '../services/folderApi'
import { Folder, FileText, Download } from 'lucide-react'

const PublicView = () => {
    const { token } = useParams();
    const [data, setData] = useState(null); // Metadata
    const [contents, setContents] = useState({ folders: [], files: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPublicData = async () => {
            try {
                // 1. Get Metadata
                const meta = await getPublicResource(token);
                setData(meta);

                // 2. If folder, get contents
                if (meta.type === 'folder') {
                    const items = await getPublicContents(token);
                    setContents(items);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchPublicData();
    }, [token]);

    if (loading) return <div className="flex justify-center items-center h-screen bg-gray-50">Loading generic link...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-500 bg-gray-50">{error}</div>;

    const { type, data: item } = data;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-6 text-center">
                    <div className="inline-block p-4 bg-blue-50 rounded-full mb-4">
                        {type === 'folder' ? <Folder size={48} className="text-blue-500" /> : <FileText size={48} className="text-blue-500" />}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">{item.name}</h1>
                    <p className="text-gray-500 mb-6">Shared via public link</p>

                    {type === 'file' && (
                        <a href={`https://madmszjmzcmoefzmjwpt.supabase.co/storage/v1/object/public/uploads/${item.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Download size={20} />
                            Download / View
                        </a>
                    )}
                </div>

                {type === 'folder' && (
                    <div className="space-y-8">
                        {contents.folders.length > 0 && (
                            <section>
                                <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Folders</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {contents.folders.map(f => (
                                        <div key={f.id} className="p-4 bg-white border rounded-xl flex items-center gap-3">
                                            <Folder className="text-yellow-500 fill-current" />
                                            <span className="font-medium text-gray-700 truncate">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {contents.files.length > 0 && (
                            <section>
                                <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Files</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {contents.files.map(f => (
                                        <div key={f.id} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileText className="text-blue-500" />
                                                <span className="font-medium text-gray-700 truncate">{f.name}</span>
                                            </div>
                                            <a href={`https://madmszjmzcmoefzmjwpt.supabase.co/storage/v1/object/public/uploads/${f.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                                                <Download size={16} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {contents.folders.length === 0 && contents.files.length === 0 && (
                            <div className="text-center text-gray-400 py-10">Empty folder</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default PublicView
