const db = require('../database/db');
const analyticsService = require('../services/analyticsService');

class ClassController {
  async getAll(req, res, next) {
    try {
      const classes = db.getClasses();
      const enriched = classes.map(c => {
        const summary = analyticsService.getDashboardSummary(c.id);
        return {
          ...c,
          totalStudents: summary.metrics.totalStudents,
          classAverage: summary.metrics.classAverage,
          atRiskCount: summary.metrics.lowCount
        };
      });
      res.json({ success: true, count: enriched.length, data: enriched });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const { classId } = req.params;
      const cls = db.getClassById(classId);
      if (!cls) {
        return res.status(404).json({ error: `Class with id ${classId} not found.` });
      }
      const summary = analyticsService.getDashboardSummary(classId);
      res.json({ success: true, data: { ...cls, summary } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClassController();
