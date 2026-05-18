const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, isAdmin, purchaseOrderController.getAllPurchaseOrders);
router.post('/', authMiddleware, isAdmin, purchaseOrderController.createPurchaseOrder);

module.exports = router;
