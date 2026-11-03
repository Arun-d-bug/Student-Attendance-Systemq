const db = require('../database/db');
const attendanceService = require('../services/attendanceService');

class StudentController {
  async getAll(req, res, next) {
    try {
      const { classId } = req.query;
      const studentsWithMetrics = attendanceService.getClassStudentMetrics(classId);
      res.json({ success: true, count: studentsWithMetrics.length, data: studentsWithMetrics });
    } catch (err) {
      next(err);
    }
  }

  async getByRoll(req, res, next) {
    try {
      const { roll } = req.params;
      const student = db.getStudentByRoll(roll);
      if (!student) {
        return res.status(404).json({ error: `Student with roll ${roll} not found.` });
      }
      const metrics = attendanceService.calculateStudentMetrics(student);
      res.json({ success: true, data: { student, metrics } });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const { roll, name, email, classId, semester } = req.body;
      if (!roll || !name) {
        return res.status(400).json({ error: 'roll and name are required fields.' });
      }
      const student = db.addStudent({ roll, name, email, classId, semester });
      res.status(201).json({ success: true, message: 'Student created successfully', data: student });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new StudentController();
