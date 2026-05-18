const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', isAdmin, analyticsController.getAnalytics);

module.exports = router;
