const express = require('express');
const router = express.Router();
const { toggleStar, getStarredHelpers } = require('../controller/star.Controller');
const protect = require('../middleware/auth.Middleware');

router.post('/toggle', protect, toggleStar);
router.get('/', protect, getStarredHelpers);

module.exports = router;
