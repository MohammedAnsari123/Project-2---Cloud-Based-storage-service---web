const { createClient } = require('@supabase/supabase-js');

// Helper to get authenticated client
const getAuthClient = (req) => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_KEY,
        { global: { headers: { Authorization: req.headers.authorization } } }
    );
}

// Helper: Service Client for bypassing RLS
const getServiceClient = () => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_KEY
    );
}

exports.createFolder = async (req, res) => {
    try {
        const supabase = getAuthClient(req); // Use user's auth context
        const { name, parent_id } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: "Folder name is required" });
        }

        const newFolder = {
            name,
            parent_id: parent_id || null,
            owner_id: userId
        };

        const { data, error } = await supabase
            .from('folders')
            .insert(newFolder)
            .select()
            .single();

        if (error) {
            console.error("Supabase Create Error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json(data);
    } catch (err) {
        console.error("Create Folder Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getFolders = async (req, res) => {
    try {
        const userId = req.user.id;
        const parent_id = req.query.parent_id === 'null' ? null : (req.query.parent_id || null);
        const { sortBy = 'name', order = 'asc' } = req.query;

        const supabase = getAuthClient(req);
        let query = supabase
            .from('folders')
            .select('*')
            .eq('is_deleted', false);

        if (parent_id) {
            // COMPLEX LOGIC: Check permissions
            let hasAccess = false;
            const serviceClient = getServiceClient();

            // A. Check Ownership
            const { data: folderOwner } = await serviceClient
                .from('folders')
                .select('owner_id')
                .eq('id', parent_id)
                .single();

            if (folderOwner && folderOwner.owner_id === userId) {
                hasAccess = true;
            }

            // B. Check Share
            if (!hasAccess) {
                const { data: share } = await serviceClient
                    .from('shares')
                    .select('*')
                    .eq('resource_id', parent_id)
                    .eq('grantee_user_id', userId)
                    .single();

                if (share) hasAccess = true;
            }

            if (hasAccess) {
                // Use Service Client to fetch subfolders (Bypass RLS)
                query = serviceClient
                    .from('folders')
                    .select('*')
                    .eq('is_deleted', false)
                    .eq('parent_id', parent_id);
            } else {
                query = query.eq('parent_id', parent_id);
            }
        } else {
            // Root "My Drive": Only show my folders
            query = query.eq('owner_id', userId).is('parent_id', null);
        }

        // Sorting
        const isAscending = order === 'asc';
        query = query.order(sortBy, { ascending: isAscending });

        const { data, error } = await query;

        if (error) {
            console.error("Supabase Fetch Error:", error);
            return res.status(500).json({ error: error.message });
        }

        // Fetch user's stars for folders to append is_starred status
        const { data: stars } = await supabase
            .from('stars')
            .select('resource_id')
            .eq('user_id', userId)
            .eq('resource_type', 'folder');

        const starredIds = new Set((stars || []).map(s => s.resource_id));

        const foldersWithStar = data.map(folder => ({
            ...folder,
            is_starred: starredIds.has(folder.id)
        }));

        res.status(200).json(foldersWithStar);
    } catch (err) {
        console.error("Get Folders Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getFolderPath = async (req, res) => {
    try {
        let folderId = req.params.id;
        const path = [];

        // Safety break to prevent infinite loops if something is wrong with data
        let attempts = 0;
        const maxAttempts = 20;

        while (folderId && attempts < maxAttempts) {
            const supabase = getAuthClient(req);
            const { data, error } = await supabase
                .from('folders')
                .select('id, name, parent_id')
                .eq('id', folderId)
                .single();

            if (error || !data) {
                break;
            }

            path.unshift({ id: data.id, name: data.name });
            folderId = data.parent_id;
            attempts++;
        }

        res.status(200).json(path);
    } catch (err) {
        console.error("Get Path Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.renameFolder = async (req, res) => {
    try {
        const folderId = req.params.id;
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) {
            return res.status(400).json({ error: "New name is required" });
        }

        const { data, error } = await getAuthClient(req)
            .from('folders')
            .update({ name })
            .eq('id', folderId)
            .eq('owner_id', userId)
            .select()
            .single();

        if (error) {
            console.error("Rename Error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error("Internal Rename Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.deleteFolder = async (req, res) => {
    try {
        const folderId = req.params.id;
        const userId = req.user.id;

        // Soft Delete: Set is_deleted = true AND deleted_at = Now
        const { data, error } = await getAuthClient(req)
            .from('folders')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString()
            })
            .eq('id', folderId)
            .eq('owner_id', userId)
            .select()
            .single();

        if (error) {
            console.error("Delete Error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json({ message: "Folder deleted successfully" });
    } catch (err) {
        console.error("Internal Delete Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.moveFolder = async (req, res) => {
    try {
        const folderId = req.params.id;
        const { parent_id } = req.body; // New parent folder ID (or null for root)
        const userId = req.user.id;

        // Prevent moving folder into itself (basic check, could be recursive)
        if (folderId === parent_id) {
            return res.status(400).json({ error: "Cannot move folder into itself" });
        }

        const { data, error } = await getAuthClient(req)
            .from('folders')
            .update({ parent_id: parent_id || null })
            .eq('id', folderId)
            .eq('owner_id', userId)
            .select()
            .single();

        if (error) {
            console.error("Move Error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.json(data);
    } catch (err) {
        console.error("Internal Move Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
