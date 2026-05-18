const express = require('express');
const router = express.Router();
const transactionsController = require('../controllers/transactions');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

// Apply authentication middleware to all transaction routes
router.use(authMiddleware);
router.use(isAdmin); // All transactions routes are admin only

// GET /api/transactions
router.get('/', transactionsController.getAllTransactions);

// POST /api/transactions
router.post('/', transactionsController.createTransaction);

// PUT /api/transactions/:id
router.put('/:id', transactionsController.updateTransaction);

// DELETE /api/transactions/:id
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router;
