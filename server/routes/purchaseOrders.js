const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');

router.get('/', purchaseOrderController.getAllPurchaseOrders);
router.post('/', purchaseOrderController.createPurchaseOrder);

module.exports = router;
