const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// GET /api/reports/csv?classId=...
router.get('/csv', reportController.exportCsv);

// GET /api/reports/assignment-cover
router.get('/assignment-cover', reportController.getAssignmentCover);

module.exports = router;

