const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/uploadMiddleware');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, productController.getAllProducts);
router.post('/', authMiddleware, isAdmin, upload.single('image'), productController.createProduct);
router.put('/:id', authMiddleware, isAdmin, upload.single('image'), productController.updateProduct);
router.delete('/:id', authMiddleware, isAdmin, productController.deleteProduct);

module.exports = router;
