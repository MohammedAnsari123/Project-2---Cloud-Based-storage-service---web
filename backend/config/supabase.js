const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require("@supabase/supabase-js")

const supabaseURL = process.env.VITE_SUPABASE_URL;
const supabaseKEY = process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseURL, supabaseKEY)

module.exports = supabase;
