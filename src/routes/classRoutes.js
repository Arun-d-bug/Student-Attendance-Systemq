const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

// GET /api/classes
router.get('/', classController.getAll);

// GET /api/classes/:classId
router.get('/:classId', classController.getById);

module.exports = router;

