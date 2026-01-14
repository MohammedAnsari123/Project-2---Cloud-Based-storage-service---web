const supabase = require('../config/supabase');

exports.searchResources = async (req, res) => {
    try {
        const { query } = req.query;
        const ownerId = req.user.id;

        if (!query) {
            return res.status(400).json({ error: "Query parameter is required" });
        }

        // Search Folders
        const { data: folders, error: folderError } = await supabase
            .from('folders')
            .select('*')
            .eq('owner_id', ownerId)
            .eq('is_deleted', false) // Only active items
            .ilike('name', `%${query}%`);

        if (folderError) {
            throw folderError;
        }

        // Search Files
        const { data: files, error: fileError } = await supabase
            .from('files')
            .select('*')
            .eq('owner_id', ownerId)
            .eq('is_deleted', false) // Only active items
            .ilike('name', `%${query}%`);

        if (fileError) {
            throw fileError;
        }

        res.json({
            folders: folders || [],
            files: files || []
        });

    } catch (err) {
        console.error("Search Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
