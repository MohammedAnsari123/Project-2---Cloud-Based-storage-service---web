const express = require('express');
const router = express.Router();
const downloadController = require('../controller/download.Controller');
const authMiddleware = require('../middleware/auth.Middleware');

router.get('/folder/:folderId', authMiddleware, downloadController.downloadFolder);

module.exports = router;
