const { createClient } = require('@supabase/supabase-js');

// Helper to get authenticated client
const getAuthClient = (req) => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_KEY,
        { global: { headers: { Authorization: req.headers.authorization } } }
    );
}

exports.toggleStar = async (req, res) => {
    try {
        const { resourceId, resourceType } = req.body;
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        if (!['file', 'folder'].includes(resourceType)) {
            return res.status(400).json({ error: "Invalid resource type" });
        }

        // Check if already starred
        const { data: existing, error: checkError } = await supabase
            .from('stars')
            .select('*')
            .eq('user_id', userId)
            .eq('resource_id', resourceId)
            .eq('resource_type', resourceType)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = JSON object not found (no rows)
            console.error("Check Star Error:", checkError);
            return res.status(500).json({ error: checkError.message });
        }

        if (existing) {
            // Unstar
            const { error: deleteError } = await supabase
                .from('stars')
                .delete()
                .eq('user_id', userId)
                .eq('resource_id', resourceId)
                .eq('resource_type', resourceType);

            if (deleteError) throw deleteError;
            return res.json({ message: "Removed from favorites", starred: false });
        } else {
            // Star
            const { error: insertError } = await supabase
                .from('stars')
                .insert({
                    user_id: userId,
                    resource_id: resourceId,
                    resource_type: resourceType
                });

            if (insertError) throw insertError;
            return res.json({ message: "Added to favorites", starred: true });
        }

    } catch (err) {
        console.error("Toggle Star Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getStarredHelpers = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        // 1. Get all stars for user
        const { data: stars, error } = await supabase
            .from('stars')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        if (!stars || stars.length === 0) {
            return res.json({ folders: [], files: [] });
        }

        // 2. Separate IDs
        const folderIds = stars.filter(s => s.resource_type === 'folder').map(s => s.resource_id);
        const fileIds = stars.filter(s => s.resource_type === 'file').map(s => s.resource_id);

        // 3. Fetch details
        let folders = [];
        let files = [];

        if (folderIds.length > 0) {
            const { data: folderData } = await supabase
                .from('folders')
                .select('*')
                .in('id', folderIds)
                .is('is_deleted', false); // Don't show deleted stars
            // Explicitly set is_starred = true since they are from stars table
            folders = (folderData || []).map(f => ({ ...f, is_starred: true }));
        }

        if (fileIds.length > 0) {
            const { data: fileData } = await supabase
                .from('files')
                .select('*')
                .in('id', fileIds)
                .is('is_deleted', false);
            files = (fileData || []).map(f => ({ ...f, is_starred: true }));
        }

        res.json({ folders, files });

    } catch (err) {
        console.error("Get Starred Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
