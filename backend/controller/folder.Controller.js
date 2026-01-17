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

        const client = getServiceClient();

        // Check Access
        // 1. Is Owner?
        let hasPermission = false;
        const { data: folder } = await client.from('folders').select('owner_id, parent_id').eq('id', folderId).single();

        if (!folder) return res.status(404).json({ error: "Folder not found" });

        if (folder.owner_id === userId) {
            hasPermission = true;
        } else {
            // 2. Recursive Check for Editor Share
            let currentId = folderId;
            let attempts = 0;
            // First check the folder itself, then parents
            // Actually, for rename, if I'm an editor of the folder itself, I can rename it? 
            // Usually yes. Or if I'm editor of parent.

            // We check the folder itself first
            const { data: share } = await client
                .from('shares')
                .select('role')
                .eq('resource_id', folderId)
                .eq('grantee_user_id', userId)
                .single();
            if (share && share.role === 'editor') hasPermission = true;

            // Traverse up
            let currParent = folder.parent_id;
            while (!hasPermission && currParent && attempts < 20) {
                const { data: parentShare } = await client
                    .from('shares')
                    .select('role')
                    .eq('resource_id', currParent)
                    .eq('grantee_user_id', userId)
                    .single();

                if (parentShare && parentShare.role === 'editor') {
                    hasPermission = true;
                    break;
                }

                // Get next parent
                const { data: parent } = await client.from('folders').select('parent_id, owner_id').eq('id', currParent).single();
                if (parent.owner_id === userId) { hasPermission = true; break; } // If I own an ancestor, I have rights
                currParent = parent ? parent.parent_id : null;
                attempts++;
            }
        }

        if (!hasPermission) {
            return res.status(403).json({ error: "Unauthorized: Editor access required" });
        }

        const { data, error } = await client
            .from('folders')
            .update({ name })
            .eq('id', folderId)
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
        const client = getServiceClient();

        // Check Access (Similar Logic)
        let hasPermission = false;
        const { data: folder } = await client.from('folders').select('owner_id, parent_id').eq('id', folderId).single();
        if (!folder) return res.status(404).json({ error: "Folder not found" });

        if (folder.owner_id === userId) {
            hasPermission = true;
        } else {
            // Recursive Check
            let currentId = folderId;
            let currParent = folder.parent_id;
            // Check folder itself
            const { data: share } = await client.from('shares').select('role').eq('resource_id', folderId).eq('grantee_user_id', userId).single();
            if (share && share.role === 'editor') hasPermission = true;

            let attempts = 0;
            while (!hasPermission && currParent && attempts < 20) {
                const { data: parentShare } = await client.from('shares').select('role').eq('resource_id', currParent).eq('grantee_user_id', userId).single();
                if (parentShare && parentShare.role === 'editor') { hasPermission = true; break; }

                const { data: parent } = await client.from('folders').select('parent_id, owner_id').eq('id', currParent).single();
                if (parent && parent.owner_id === userId) { hasPermission = true; break; }
                currParent = parent ? parent.parent_id : null;
                attempts++;
            }
        }

        if (!hasPermission) return res.status(403).json({ error: "Unauthorized" });

        // Soft Delete
        const { data, error } = await client
            .from('folders')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString()
            })
            .eq('id', folderId)
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
        const client = getServiceClient();

        // Prevent moving folder into itself (basic check, could be recursive)
        if (folderId === parent_id) {
            return res.status(400).json({ error: "Cannot move folder into itself" });
        }

        // Check Access to SOURCE (Folder being moved)
        let hasPermission = false;
        const { data: folder } = await client.from('folders').select('owner_id, parent_id').eq('id', folderId).single();
        if (!folder) return res.status(404).json({ error: "Folder not found" });

        if (folder.owner_id === userId) hasPermission = true;
        else {
            // Recursive Check
            let currParent = folder.parent_id;
            // Check folder itself
            const { data: share } = await client.from('shares').select('role').eq('resource_id', folderId).eq('grantee_user_id', userId).single();
            if (share && share.role === 'editor') hasPermission = true;

            let attempts = 0;
            while (!hasPermission && currParent && attempts < 20) {
                const { data: parentShare } = await client.from('shares').select('role').eq('resource_id', currParent).eq('grantee_user_id', userId).single();
                if (parentShare && parentShare.role === 'editor') { hasPermission = true; break; }

                const { data: parent } = await client.from('folders').select('parent_id, owner_id').eq('id', currParent).single();
                if (parent && parent.owner_id === userId) { hasPermission = true; break; }

                currParent = parent ? parent.parent_id : null;
                attempts++;
            }
        }
        if (!hasPermission) return res.status(403).json({ error: "Unauthorized" });

        // Check Access to DESTINATION (parent_id)
        // If parent_id is null (Root), user must be authenticated (always true here). 
        // Logic: You can move shared items to your own root.
        // Or if moving to another folder, you must have write access to that folder too.
        if (parent_id) {
            let hasDestPermission = false;
            const { data: destFolder } = await client.from('folders').select('owner_id, parent_id').eq('id', parent_id).single();
            if (destFolder.owner_id === userId) hasDestPermission = true;
            else {
                // Check if I'm editor of destination
                // ... (Simplified: If I can see it, I can likely move to it? strict: need Editor)
                // For now, let's assume if you can see it (Shared), you can move into it.
                // Ideally check for 'editor' role on destination path.
                // Re-using logic:
                let currP = parent_id;
                let att = 0;
                while (!hasDestPermission && currP && att < 20) {
                    const { data: pShare } = await client.from('shares').select('role').eq('resource_id', currP).eq('grantee_user_id', userId).single();
                    if (pShare && pShare.role === 'editor') { hasDestPermission = true; break; }
                    const { data: p } = await client.from('folders').select('parent_id, owner_id').eq('id', currP).single();
                    if (p && p.owner_id === userId) { hasDestPermission = true; break; }
                    currP = p ? p.parent_id : null;
                    att++;
                }
            }
            if (!hasDestPermission) return res.status(403).json({ error: "Cannot move to read-only folder" });
        }


        const { data, error } = await client
            .from('folders')
            .update({ parent_id: parent_id || null })
            .eq('id', folderId)
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
