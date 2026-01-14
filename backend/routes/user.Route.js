const express = require('express')
const route = express.Router();
const { registerUser, loginUser } = require('../controller/user.Controller')

route.post('/register', registerUser);
route.post('/login', loginUser);
// Note: This route requires Auth middleware, which must be applied in server.js or here. 
// Assuming server.js applies it or we export it wrapper? 
// Let's check server.js first. 
// Actually I will import middleware here to be safe.
const protect = require('../middleware/auth.Middleware');
route.get('/storage', protect, require('../controller/user.Controller').getStorageUsage);

module.exports = route
