const express = require('express');
const router = express.Router();
const trashController = require('../controller/trash.Controller');
const authMiddleware = require('../middleware/auth.Middleware');

router.get('/', authMiddleware, trashController.getTrash);
router.put('/:type/:id/restore', authMiddleware, trashController.restoreItem);
router.delete('/:type/:id', authMiddleware, trashController.deleteItem);

module.exports = router;
