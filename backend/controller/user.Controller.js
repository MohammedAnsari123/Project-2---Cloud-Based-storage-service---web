const supabase = require('../config/supabase')
const { generateToken } = require('../utils/jwt')

const registerUser = async (req, res) => {
    const { email, password, username } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });
    if (error) {
        console.log("Supabase Sign Up Error: ", error.message);
        return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ token: data.session.access_token, user: data.user })
}

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        console.log("Supabase Login Error: ", error.message);
        return res.status(401).json({ error: error.message });
    }

    if (!data.session) {
        return res.status(401).json({ error: "Session not created" });
    }

    return res.status(200).json({ token: data.session.access_token, user: data.user })
}

const getStorageUsage = async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('files')
            .select('size')
            .eq('owner_id', userId); // Count ALL files (even trash) towards quota

        if (error) throw error;

        const totalBytes = data.reduce((acc, file) => acc + (file.size || 0), 0);

        return res.json({
            usedBytes: totalBytes,
            totalBytes: 15 * 1024 * 1024 * 1024 // 15 GB
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { registerUser, loginUser, getStorageUsage }
