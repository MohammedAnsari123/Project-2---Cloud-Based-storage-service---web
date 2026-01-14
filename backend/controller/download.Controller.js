const { createClient } = require('@supabase/supabase-js');
const archiver = require('archiver');

// Helper to get authenticated client
const getAuthClient = (req) => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_KEY,
        { global: { headers: { Authorization: req.headers.authorization } } }
    );
};

// Recursive function to get all files in valid structure
// Returns array of: { fileData, zipPath }
const getFolderContents = async (supabase, folderId, currentPath, userId) => {
    let items = [];

    // 1. Get Files in this folder
    const { data: files } = await supabase
        .from('files')
        .select('*')
        .eq('folder_id', folderId)
        .eq('owner_id', userId)
        .eq('is_deleted', false);

    if (files) {
        files.forEach(f => {
            items.push({ type: 'file', data: f, path: currentPath + f.name });
        });
    }

    // 2. Get Subfolders
    const { data: folders } = await supabase
        .from('folders')
        .select('id, name')
        .eq('parent_id', folderId)
        .eq('owner_id', userId)
        .eq('is_deleted', false);

    if (folders) {
        for (const sub of folders) {
            // Add folder entry (optional, usually archiver creates dirs automatically if we add files in them,
            // but empty folders might need explicit addition. For now ignore empty folders).
            const subItems = await getFolderContents(supabase, sub.id, currentPath + sub.name + '/', userId);
            items = items.concat(subItems);
        }
    }

    return items;
};

exports.downloadFolder = async (req, res) => {
    try {
        const { folderId } = req.params;
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        // 1. Get Folder Name (for zip filename)
        const { data: folder } = await supabase
            .from('folders')
            .select('name')
            .eq('id', folderId)
            .single();

        const folderName = folder ? folder.name : 'archive';

        // 2. Scan structure
        const allItems = await getFolderContents(supabase, folderId, '', userId);

        if (allItems.length === 0) {
            return res.status(404).json({ error: "Folder is empty or not found" });
        }

        // 3. Setup Archive
        res.attachment(`${folderName}.zip`);
        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.on('error', (err) => {
            console.error("Archive Error:", err);
            if (!res.headersSent) res.status(500).json({ error: "Compression failed" });
        });

        // Pipe archive data to response
        archive.pipe(res);

        // 4. Download and append files
        for (const item of allItems) {
            try {
                // remove leading slash if any
                const storagePath = item.data.url.startsWith('/') ? item.data.url.slice(1) : item.data.url;

                // Download from Supabase
                const { data, error } = await supabase.storage
                    .from('uploads')
                    .download(storagePath);

                if (error || !data) {
                    console.error(`Failed to download ${item.data.name}:`, error);
                    continue; // Skip failed files but continue zipping
                }

                // data is a Blob or Buffer. In Node it's usually an ArrayBuffer or Buffer.
                // Supabase-js in Node returns a Blob by default? No, usually it depends on environment.
                // We convert to Buffer to be safe.
                const buffer = Buffer.from(await data.arrayBuffer());

                archive.append(buffer, { name: item.path });

            } catch (err) {
                console.error(`Error processing ${item.data.name}:`, err);
            }
        }

        await archive.finalize();

    } catch (err) {
        console.error("Download Folder Error:", err);
        if (!res.headersSent) res.status(500).json({ error: "Internal Server Error" });
    }
};
