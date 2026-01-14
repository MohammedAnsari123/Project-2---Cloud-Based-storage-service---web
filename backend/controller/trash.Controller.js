const { createClient } = require('@supabase/supabase-js');

// Helper to get authenticated client
const getAuthClient = (req) => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_KEY,
        { global: { headers: { Authorization: req.headers.authorization } } }
    );
}

exports.getTrash = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        // Fetch deleted folders
        const { data: folders, error: folderError } = await supabase
            .from('folders')
            .select('*')
            .eq('owner_id', userId)
            .eq('is_deleted', true);

        if (folderError) throw folderError;

        // Fetch deleted files
        const { data: files, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('owner_id', userId)
            .eq('is_deleted', true);

        if (fileError) throw fileError;

        res.json({ folders: folders || [], files: files || [] });
    } catch (err) {
        console.error("Fetch Trash Error:", err);
        res.status(500).json({ error: "Failed to fetch trash items" });
    }
};

exports.restoreItem = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        const table = type === 'folder' ? 'folders' : 'files';

        const { error } = await supabase
            .from(table)
            .update({ is_deleted: false, deleted_at: null })
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;

        res.json({ message: "Item restored successfully" });
    } catch (err) {
        console.error("Restore Error:", err);
        res.status(500).json({ error: "Failed to restore item" });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { type, id } = req.params;
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        const table = type === 'folder' ? 'folders' : 'files';

        // NOTE: For real file deletion, we should also delete from Storage bucket.
        // Assuming metadata delete is sufficient for this scope, or trigger handles it.
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id)
            .eq('owner_id', userId);

        if (error) throw error;

        res.json({ message: "Item permanently deleted" });
    } catch (err) {
        console.error("Delete Forever Error:", err);
        res.status(500).json({ error: "Failed to delete item" });
    }
};
