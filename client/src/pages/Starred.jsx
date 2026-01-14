import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { getStarred } from '../services/folderApi'
import { useAuth } from '../context/authContext'
import { Folder, FileText, Download, Star } from 'lucide-react'

const Starred = () => {
  const { token, loading: authLoading } = useAuth();
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        const data = await getStarred(token);
        setFolders(data.folders || []);
        setFiles(data.files || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) fetchData();
  }, [token, authLoading]);

  if (authLoading) return <div>Loading...</div>;

  return (
    <Layout>
      <div className="flex items-center gap-2 mb-6 text-xl font-semibold text-gray-800">
        <Star className="text-yellow-400 fill-current" />
        <h2>Starred Items</h2>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading favorites...</div>
      ) : (folders.length === 0 && files.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
          <Star className="text-gray-300 w-16 h-16 mb-4" />
          <p className="text-gray-500 font-medium">No starred items yet</p>
          <p className="text-gray-400 text-sm mt-1">Star items in your dashboard to see them here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Folders */}
          {folders.length > 0 && (
            <section>
              <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Folders</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map(folder => (
                  <div key={folder.id} className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Folder className="text-yellow-500 fill-yellow-500/20" />
                      <span className="font-medium text-gray-700 truncate">{folder.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Files */}
          {files.length > 0 && (
            <section>
              <h3 className="font-semibold mb-3 text-gray-500 uppercase text-xs tracking-wider">Files</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map(file => (
                  <div key={file.id}
                    className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText className="text-blue-500" />
                      <span className="font-medium text-gray-700 truncate">{file.name}</span>
                    </div>
                    <a href={`https://madmszjmzcmoefzmjwpt.supabase.co/storage/v1/object/public/uploads/${file.url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                      <Download size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </Layout>
  )
}

export default Starred
