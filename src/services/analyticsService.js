const db = require('../database/db');
const attendanceService = require('./attendanceService');
const config = require('../config');

class AnalyticsService {
  /**
   * Comprehensive metrics for teacher dashboard
   */
  getDashboardSummary(classId = 'cse-ai-sem1', date = null) {
    const todayStr = date || new Date().toISOString().slice(0, 10);
    const targetClass = db.getClassById(classId) || db.getClasses()[0];
    const resolvedClassId = targetClass ? targetClass.id : classId;

    const studentMetrics = attendanceService.getClassStudentMetrics(resolvedClassId);
    const totalStudents = studentMetrics.length;

    // Today's attendance counts
    const todayAttendance = attendanceService.getClassAttendanceByDate(resolvedClassId, todayStr);
    const presentToday = todayAttendance.presentCount;
    const absentToday = todayAttendance.absentCount;

    // Low attendance analysis (< 75%)
    const atRiskStudents = studentMetrics.filter(s => s.percentage < config.attendanceThresholdPct);
    const lowCount = atRiskStudents.length;

    // Class average calculation
    const totalPctSum = studentMetrics.reduce((sum, s) => sum + s.percentage, 0);
    const classAverage = totalStudents > 0 ? Math.round(totalPctSum / totalStudents) : 0;

    // Attendance distribution
    const distribution = {
      excellent: studentMetrics.filter(s => s.percentage >= 90).length,
      satisfactory: studentMetrics.filter(s => s.percentage >= 75 && s.percentage < 90).length,
      atRisk: lowCount
    };

    // Low attendance alert banner message
    let alertMessage = '';
    if (lowCount === 0) {
      alertMessage = 'All students are currently meeting or exceeding the 75% attendance requirement.';
    } else if (lowCount === 1) {
      alertMessage = `${atRiskStudents[0].name} is currently below the required 75% attendance.`;
    } else {
      alertMessage = `${lowCount} students are currently below the required 75% attendance.`;
    }

    return {
      class: targetClass,
      date: todayStr,
      metrics: {
        totalStudents,
        presentToday,
        absentToday,
        unrecordedToday: todayAttendance.unrecordedCount,
        lowCount,
        classAverage,
        threshold: config.attendanceThresholdPct
      },
      alert: {
        hasAlert: lowCount > 0,
        count: lowCount,
        message: alertMessage,
        students: atRiskStudents
      },
      distribution
    };
  }

  /**
   * Daily trends for the selected class (e.g., last 10 working days)
   */
  getClassDailyTrends(classId = 'cse-ai-sem1', limit = 10) {
    const records = db.getAttendanceRecords({ classId });
    // Distinct dates
    const dateMap = new Map();
    for (const r of records) {
      if (!dateMap.has(r.date)) {
        dateMap.set(r.date, { date: r.date, present: 0, absent: 0, total: 0 });
      }
      const entry = dateMap.get(r.date);
      entry.total += 1;
      if (r.status === 'present') entry.present += 1;
      if (r.status === 'absent') entry.absent += 1;
    }

    const trends = Array.from(dateMap.values())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-limit)
      .map(d => ({
        date: d.date,
        present: d.present,
        absent: d.absent,
        total: d.total,
        rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
      }));

    return trends;
  }
}

module.exports = new AnalyticsService();

