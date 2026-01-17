const { createClient } = require('@supabase/supabase-js');

// Helper to get authenticated client
const getAuthClient = (req) => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_KEY,
        { global: { headers: { Authorization: req.headers.authorization } } }
    );
}

// Helper: Service Client for bypassing RLS (Restricted Use)
const getServiceClient = () => {
    return createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_KEY
    );
}

const uploadFileMetadata = async (req, res) => {
    const { name, size, type, url, parent_id } = req.body;
    const userId = req.user.id;
    const supabase = getAuthClient(req);

    const { data, error } = await supabase
        .from('files')
        .insert([{
            name,
            size,
            type,
            url,
            folder_id: parent_id || null,
            owner_id: userId
        }])
        .select()
        .single();

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    return res.status(201).json(data);
};

const getFiles = async (req, res) => {
    const userId = req.user.id;
    const parent_id = req.query.parent_id === 'null' ? null : (req.query.parent_id || null);
    const { sortBy = 'created_at', order = 'desc', filterType = 'all' } = req.query;

    const supabase = getAuthClient(req);
    let query = supabase
        .from('files')
        .select('*')
        .eq('is_deleted', false);

    if (parent_id) {
        // Subfolder: Trust RLS (Shared or Owned)
        query = query.eq('folder_id', parent_id);
    } else {
        // Root: Only mine
        query = query.eq('owner_id', userId).is('folder_id', null);
    }

    // Filter by Type
    if (filterType !== 'all') {
        if (filterType === 'image') {
            query = query.ilike('type', 'image/%');
        } else if (filterType === 'video') {
            query = query.ilike('type', 'video/%');
        } else if (filterType === 'document') {
            // Basic document types check
            query = query.or('type.ilike.application/pdf,type.ilike.application/msword,type.ilike.application/vnd.openxmlformats-officedocument.wordprocessingml.document,type.ilike.text/plain');
        }
    }

    // Sorting
    // Supabase order: column, { ascending: boolean }
    const isAscending = order === 'asc';
    query = query.order(sortBy, { ascending: isAscending });

    const { data, error } = await query;

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    // Fetch user's stars for files
    const { data: stars } = await supabase
        .from('stars')
        .select('resource_id')
        .eq('user_id', userId)
        .eq('resource_type', 'file');

    const starredIds = new Set((stars || []).map(s => s.resource_id));

    const filesWithStar = data.map(file => ({
        ...file,
        is_starred: starredIds.has(file.id)
    }));

    return res.json(filesWithStar)
};

const deleteFile = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Soft Delete: Just update the flag
    const { error } = await getAuthClient(req)
        .from('files')
        .update({
            is_deleted: true,
            deleted_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('owner_id', userId);

    if (error) {
        return res.status(400).json({ error: error.message })
    }

    return res.json({ message: "File moved to trash" });
}

const renameFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.id;

        if (!name) return res.status(400).json({ error: "Name is required" });

        const { data, error } = await getAuthClient(req)
            .from('files')
            .update({ name })
            .eq('id', id)
            .eq('owner_id', userId)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


const moveFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { parent_id } = req.body;
        const userId = req.user.id;

        const { data, error } = await getAuthClient(req)
            .from('files')
            .update({ folder_id: parent_id || null })
            .eq('id', id)
            .eq('owner_id', userId)
            .select()
            .single();

        if (error) return res.status(400).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

const getRecentFiles = async (req, res) => {
    try {
        const userId = req.user.id;
        const supabase = getAuthClient(req);

        const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('owner_id', userId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return res.status(400).json({ error: error.message });
        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { uploadFileMetadata, getFiles, deleteFile, renameFile, moveFile, getRecentFiles }
