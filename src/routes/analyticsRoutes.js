const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

// GET /api/analytics/dashboard?classId=...&date=...
router.get('/dashboard', analyticsController.getDashboard);

// GET /api/analytics/trends?classId=...&limit=...
router.get('/trends', analyticsController.getTrends);

module.exports = router;

