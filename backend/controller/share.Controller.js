const supabase = require('../config/supabase');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Helper to get Service client (if env var exists) or fallback to Anon (relying on RLS)
const getServiceClient = () => {
    const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_KEY;
    const url = process.env.VITE_SUPABASE_URL;
    return createClient(url, serviceKey);
};

exports.shareResource = async (req, res) => {
    try {
        const { email, resourceId, resourceType, role } = req.body;
        const ownerId = req.user.id; // From auth middleware

        // Debug: Check if Service Key is loaded
        if (!process.env.SUPABASE_SERVICE_KEY) {
            console.warn("WARNING: SUPABASE_SERVICE_KEY is missing. Falling back to Anon key (RLS might block).");
        }

        if (!email || !resourceId || !resourceType) {
            return res.status(400).json({ error: "Email, resourceId, and resourceType are required." });
        }

        if (!['file', 'folder'].includes(resourceType)) {
            return res.status(400).json({ error: "Invalid resource type." });
        }

        const client = getServiceClient(); // Use Service Client to bypass RLS

        // 1. Find the user by email
        console.log(`Looking up user: ${email}`);
        const { data: users, error: userError } = await client
            .from('users')
            .select('id')
            .ilike('email', email.trim()) // Case-insensitive
            .single();

        if (userError || !users) {
            console.error("User Lookup Error:", userError);
            return res.status(404).json({ error: "User with this email not found." });
        }

        const granteeId = users.id;

        if (granteeId === ownerId) {
            return res.status(400).json({ error: "You cannot share with yourself." });
        }

        // 2. Create the Share record
        const { data, error } = await client
            .from('shares')
            .insert({
                resource_type: resourceType,
                resource_id: resourceId,
                grantee_user_id: granteeId,
                role: role || 'viewer',
                created_by: ownerId
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: "Already shared with this user." });
            }
            console.error("Share Error:", error);
            return res.status(500).json({ error: error.message });
        }

        res.status(201).json({ message: "Shared successfully", share: data });

    } catch (err) {
        console.error("Internal Share Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.createPublicLink = async (req, res) => {
    try {
        const { resourceId, resourceType } = req.body;
        const userId = req.user.id;
        const { createClient } = require('@supabase/supabase-js');

        // Create user-authenticated client to satisfy RLS
        const authSupabase = createClient(
            process.env.VITE_SUPABASE_URL,
            process.env.VITE_SUPABASE_KEY,
            { global: { headers: { Authorization: req.headers.authorization } } }
        );

        const token = crypto.randomBytes(32).toString('hex');

        const { data, error } = await authSupabase
            .from('link_shares')
            .insert({
                resource_id: resourceId,
                resource_type: resourceType,
                token: token,
                created_by: userId
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ token, link: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/public/${token}` });

    } catch (error) {
        console.error("Create Link Error Details:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getPublicResource = async (req, res) => {
    try {
        const { token } = req.params;
        const client = getServiceClient(); // Use admin/service client if available

        const { data: linkData, error: linkError } = await client
            .from('link_shares')
            .select('*')
            .eq('token', token)
            .single();

        if (linkError) {
            console.error("Link Lookup Error:", linkError);
            // It might be 406 Not Acceptable or 404
        }

        if (linkError || !linkData) {
            return res.status(404).json({ error: "Invalid or expired link" });
        }

        let resourceData = null;
        if (linkData.resource_type === 'folder') {
            const { data } = await client.from('folders').select('*').eq('id', linkData.resource_id).single();
            resourceData = data;
        } else {
            const { data } = await client.from('files').select('*').eq('id', linkData.resource_id).single();
            resourceData = data;
        }

        if (!resourceData) return res.status(404).json({ error: "Resource not found" });

        res.json({
            type: linkData.resource_type,
            data: resourceData
        });

    } catch (error) {
        console.error("Get Public Resource Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getPublicFolderContents = async (req, res) => {
    try {
        const { token } = req.params;
        const client = getServiceClient(); // Use admin/service client

        // 1. Verify Token and get Resource ID
        const { data: linkData, error: linkError } = await client
            .from('link_shares')
            .select('*')
            .eq('token', token)
            .single();

        if (linkError || !linkData) {
            return res.status(404).json({ error: "Invalid or expired link" });
        }

        if (linkData.resource_type !== 'folder') {
            return res.status(400).json({ error: "Not a folder" });
        }

        const folderId = linkData.resource_id;

        // 2. Fetch Children using privileged client
        const { data: folders } = await client
            .from('folders')
            .select('*')
            .eq('parent_id', folderId)
            .eq('is_deleted', false);

        const { data: files } = await client
            .from('files')
            .select('*')
            .eq('folder_id', folderId)
            .eq('is_deleted', false);

        res.json({
            folders: folders || [],
            files: files || []
        });

    } catch (error) {
        console.error("Get Public Contents Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.getSharedWithMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const client = getServiceClient(); // Use Service Client to bypass RLS

        // Fetch shares where grantee is me
        const { data, error } = await client
            .from('shares')
            .select(`
                id,
                resource_type,
                resource_id,
                role,
                created_by,
                created_at
            `)
            .eq('grantee_user_id', userId);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const sharedItems = data || [];
        if (sharedItems.length === 0) {
            return res.json([]);
        }

        // Fetch resource details using Service Client
        const folderIds = sharedItems.filter(s => s.resource_type === 'folder').map(s => s.resource_id);
        const fileIds = sharedItems.filter(s => s.resource_type === 'file').map(s => s.resource_id);

        let foldersMap = {};
        let filesMap = {};

        if (folderIds.length > 0) {
            const { data: folderData } = await client.from('folders').select('*').in('id', folderIds);
            (folderData || []).forEach(f => foldersMap[f.id] = f);
        }

        if (fileIds.length > 0) {
            const { data: fileData } = await client.from('files').select('*').in('id', fileIds);
            (fileData || []).forEach(f => filesMap[f.id] = f);
        }

        // Attach details
        const enrichedShares = sharedItems.map(share => {
            const details = share.resource_type === 'folder'
                ? foldersMap[share.resource_id]
                : filesMap[share.resource_id];

            // If resource was deleted or not found, we might want to hide it or show as unavailable
            if (!details) return null;

            return {
                ...share,
                name: details.name,
                url: details.url, // for files
                size: details.size, // for files
                ...details // spread all other details
            };
        }).filter(item => item !== null); // remove nulls

        res.json(enrichedShares);



    } catch (err) {
        console.error("Get Shared Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.getShareUsers = async (req, res) => {
    try {
        const { resourceId, resourceType } = req.query;
        const client = getServiceClient();

        if (!resourceId || !resourceType) {
            return res.status(400).json({ error: "Resource ID and Type required" });
        }

        const { data, error } = await client
            .from('shares')
            .select('id, resource_id, resource_type, role, grantee_user_id, created_at')
            .eq('resource_id', resourceId)
            .eq('resource_type', resourceType);

        if (error) throw error;

        // Fetch user emails for grantees
        const userIds = data.map(s => s.grantee_user_id);
        if (userIds.length === 0) return res.json([]);

        const { data: users } = await client
            .from('users')
            .select('id, email')
            .in('id', userIds);

        const userMap = {};
        users.forEach(u => userMap[u.id] = u);

        const result = data.map(share => ({
            share_id: share.id,
            user_id: share.grantee_user_id,
            email: userMap[share.grantee_user_id]?.email || 'Unknown',
            role: share.role,
            created_at: share.created_at
        }));

        res.json(result);
    } catch (err) {
        console.error("Get Share Users Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateShareRole = async (req, res) => {
    try {
        const { shareId, role } = req.body;
        const userId = req.user.id;
        const client = getServiceClient();

        // Verify requestor is the owner of the resource associated with this share
        // 1. Get Share info
        const { data: share } = await client.from('shares').select('*').eq('id', shareId).single();
        if (!share) return res.status(404).json({ error: "Share not found" });

        // 2. Check ownership
        if (share.created_by !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { data, error } = await client
            .from('shares')
            .update({ role })
            .eq('id', shareId)
            .select()
            .single();

        if (error) throw error;
        res.json(data);

    } catch (err) {
        console.error("Update Share Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.removeShare = async (req, res) => {
    try {
        const { shareId } = req.body; // or params
        const userId = req.user.id;
        const client = getServiceClient();

        const { data: share } = await client.from('shares').select('*').eq('id', shareId).single();
        if (!share) return res.status(404).json({ error: "Share not found" });

        if (share.created_by !== userId) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { error } = await client.from('shares').delete().eq('id', shareId);
        if (error) throw error;

        res.json({ message: "Access revoked" });

    } catch (err) {
        console.error("Remove Share Error:", err);
        res.status(500).json({ error: err.message });
    }
};

