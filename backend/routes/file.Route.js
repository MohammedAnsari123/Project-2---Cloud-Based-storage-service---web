const express = require('express');
const router = express.Router();

const { uploadFileMetadata, getFiles, deleteFile, renameFile, moveFile, getRecentFiles } = require('../controller/file.Controller');

const protect = require('../middleware/auth.Middleware');

router.post('/', protect, uploadFileMetadata);
router.get('/', protect, getFiles);
router.get('/recent', protect, getRecentFiles); // New Route
router.put('/:id', protect, renameFile);
router.put('/:id/move', protect, moveFile); // New Move Route
router.delete('/:id', protect, deleteFile);

module.exports = router;
