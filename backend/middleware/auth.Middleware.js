const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    console.log("Auth Middleware Error:", error.message);
    console.log("Received Token:", token);
    return res.status(401).json({ error: "Invalid token" });
  }

  req.user = data.user;
  next();
};

module.exports = protect;
