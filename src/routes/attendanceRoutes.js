const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// GET /api/attendance?classId=...&date=...
router.get('/', attendanceController.getByDate);

// POST /api/attendance/mark
router.post('/mark', attendanceController.markAttendance);

// POST /api/attendance/mark-all
router.post('/mark-all', attendanceController.markAll);

// DELETE /api/attendance/reset?date=...&classId=...
router.delete('/reset', attendanceController.resetAttendance);

// GET /api/attendance/student/:roll
router.get('/student/:roll', attendanceController.getStudentHistory);

module.exports = router;

