const express = require('express');
const { searchResources } = require('../controller/search.Controller');
const protect = require('../middleware/auth.Middleware');

const router = express.Router();

router.get('/', protect, searchResources);

module.exports = router;
