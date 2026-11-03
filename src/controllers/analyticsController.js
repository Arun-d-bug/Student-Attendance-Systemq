const analyticsService = require('../services/analyticsService');

class AnalyticsController {
  async getDashboard(req, res, next) {
    try {
      const { classId, date } = req.query;
      const summary = analyticsService.getDashboardSummary(classId, date);
      res.json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  }

  async getTrends(req, res, next) {
    try {
      const { classId, limit } = req.query;
      const trends = analyticsService.getClassDailyTrends(classId, limit ? parseInt(limit, 10) : 10);
      res.json({ success: true, count: trends.length, data: trends });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AnalyticsController();

