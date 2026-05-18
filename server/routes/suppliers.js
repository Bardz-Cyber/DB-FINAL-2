const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, isAdmin, supplierController.getAllSuppliers);
router.post('/', authMiddleware, isAdmin, supplierController.createSupplier);

module.exports = router;
