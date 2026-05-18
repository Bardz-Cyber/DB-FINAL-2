const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, isAdmin, stockController.getStock);
router.post('/update', authMiddleware, isAdmin, stockController.updateStock);

module.exports = router;
