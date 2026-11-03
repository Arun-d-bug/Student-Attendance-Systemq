const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// GET /api/students?classId=...
router.get('/', studentController.getAll);

// GET /api/students/:roll
router.get('/:roll', studentController.getByRoll);

// POST /api/students
router.post('/', studentController.create);

module.exports = router;

