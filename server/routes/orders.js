const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Student routes
router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getStudentOrders);

// Admin routes
router.get('/', isAdmin, orderController.getAllOrders);
router.put('/:id/status', isAdmin, orderController.updateOrderStatus);

module.exports = router;
