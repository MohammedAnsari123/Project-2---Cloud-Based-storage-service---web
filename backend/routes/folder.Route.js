const express = require('express');
const { createFolder, getFolders, getFolderPath, renameFolder, deleteFolder, moveFolder } = require('../controller/folder.Controller')
const protect = require('../middleware/auth.Middleware')

const router = express.Router();

router.post('/', protect, createFolder);
router.get('/', protect, getFolders);
router.get('/:id/path', protect, getFolderPath);
router.put('/:id', protect, renameFolder);
router.put('/:id/move', protect, moveFolder); // New Move Route
router.delete('/:id', protect, deleteFolder);

module.exports = router;
