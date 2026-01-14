const express = require('express');
const router = express.Router();
const { shareResource, getSharedWithMe, createPublicLink, getPublicResource, getPublicFolderContents, getShareUsers, updateShareRole, removeShare } = require('../controller/share.Controller');
const protect = require('../middleware/auth.Middleware');

router.post('/', protect, shareResource);
router.get('/me', protect, getSharedWithMe);
router.get('/users', protect, getShareUsers);
router.put('/role', protect, updateShareRole);
router.delete('/remove', protect, removeShare);

// Public Link Routes
router.post('/link', protect, createPublicLink); // Create link (Protected)
router.get('/public/:token', getPublicResource); // Access link (Public)
router.get('/public/:token/items', getPublicFolderContents); // Access folder contents (Public)

module.exports = router;
