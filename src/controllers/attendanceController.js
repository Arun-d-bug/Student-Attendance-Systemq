const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async getByDate(req, res, next) {
    try {
      const { classId, date } = req.query;
      if (!classId) {
        return res.status(400).json({ error: 'classId query parameter is required.' });
      }
      const targetDate = date || new Date().toISOString().slice(0, 10);
      const data = attendanceService.getClassAttendanceByDate(classId, targetDate);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async markAttendance(req, res, next) {
    try {
      const { date, classId, records, course } = req.body;
      if (!date || !records) {
        return res.status(400).json({ error: 'date and records array are required in the request body.' });
      }
      const result = attendanceService.markAttendance({
        date,
        classId,
        records,
        course,
        markedBy: req.body.markedBy || 'Faculty Yash More'
      });
      res.json({ success: true, message: 'Attendance marked successfully', data: result });
    } catch (err) {
      next(err);
    }
  }

  async markAll(req, res, next) {
    try {
      const { classId, date, status, course } = req.body;
      if (!classId || !date || !status) {
        return res.status(400).json({ error: 'classId, date, and status ("present"|"absent") are required.' });
      }
      const result = attendanceService.markAll(classId, date, status, course);
      res.json({ success: true, message: `All students marked as ${status}`, data: result });
    } catch (err) {
      next(err);
    }
  }

  async resetAttendance(req, res, next) {
    try {
      const { date, classId } = req.query;
      if (!date) {
        return res.status(400).json({ error: 'date query parameter is required.' });
      }
      const result = attendanceService.resetAttendance(date, classId);
      res.json({ success: true, message: `Attendance for date ${date} reset successfully`, data: result });
    } catch (err) {
      next(err);
    }
  }

  async getStudentHistory(req, res, next) {
    try {
      const { roll } = req.params;
      const data = attendanceService.getStudentHistory(roll);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AttendanceController();

