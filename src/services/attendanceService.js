const db = require('../database/db');
const config = require('../config');

class AttendanceService {
  /**
   * Calculate attendance metrics for an individual student
   */
  calculateStudentMetrics(student, records = null) {
    const studentRecords = records || db.getAttendanceRecords({ roll: student.roll });
    const workingDays = studentRecords.length;
    const presentDays = studentRecords.filter(r => r.status === 'present').length;
    const absentDays = studentRecords.filter(r => r.status === 'absent').length;
    const percentage = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
    const isBelowThreshold = percentage < config.attendanceThresholdPct;

    // Advanced recovery calculation
    let requiredClassesToRecover = 0;
    let allowedAbsencesBuffer = 0;

    if (workingDays > 0) {
      if (isBelowThreshold) {
        // k >= 3*w - 4*p
        const needed = (3 * workingDays) - (4 * presentDays);
        requiredClassesToRecover = Math.max(1, Math.ceil(needed));
      } else {
        // m <= (4*p - 3*w) / 3
        const surplus = ((4 * presentDays) - (3 * workingDays)) / 3;
        allowedAbsencesBuffer = Math.max(0, Math.floor(surplus));
      }
    }

    return {
      roll: student.roll,
      name: student.name,
      email: student.email,
      classId: student.classId,
      semester: student.semester,
      workingDays,
      presentDays,
      absentDays,
      percentage,
      status: isBelowThreshold ? 'at_risk' : 'on_track',
      isBelowThreshold,
      requiredClassesToRecover,
      allowedAbsencesBuffer,
      threshold: config.attendanceThresholdPct
    };
  }

  /**
   * Get all students for a class with their computed live statistics
   */
  getClassStudentMetrics(classId) {
    const students = db.getStudents(classId ? { classId } : {});
    const allRecords = db.getAttendanceRecords(classId ? { classId } : {});

    // Group records by roll for O(N) performance
    const recordsByRoll = new Map();
    for (const r of allRecords) {
      const rollKey = r.roll.toLowerCase();
      if (!recordsByRoll.has(rollKey)) {
        recordsByRoll.set(rollKey, []);
      }
      recordsByRoll.get(rollKey).push(r);
    }

    return students.map(s => {
      const sRecords = recordsByRoll.get(s.roll.toLowerCase()) || [];
      return this.calculateStudentMetrics(s, sRecords);
    });
  }

  /**
   * Get attendance for a class on a specific date, merged with student list
   */
  getClassAttendanceByDate(classId, date) {
    const students = db.getStudents({ classId });
    const records = db.getAttendanceRecords({ classId, date });
    const studentMetrics = this.getClassStudentMetrics(classId);

    const recordMap = new Map();
    for (const r of records) {
      recordMap.set(r.roll.toLowerCase(), r);
    }

    const rows = students.map(s => {
      const metrics = studentMetrics.find(m => m.roll.toLowerCase() === s.roll.toLowerCase());
      const rec = recordMap.get(s.roll.toLowerCase());
      return {
        roll: s.roll,
        name: s.name,
        email: s.email,
        classId: s.classId,
        percentage: metrics ? metrics.percentage : 0,
        statusBadge: metrics && metrics.isBelowThreshold ? 'low' : 'good',
        attendanceStatus: rec ? rec.status : null, // 'present', 'absent', or null
        markedAt: rec ? rec.updatedAt : null,
        course: rec ? rec.course : null
      };
    });

    const presentCount = rows.filter(r => r.attendanceStatus === 'present').length;
    const absentCount = rows.filter(r => r.attendanceStatus === 'absent').length;
    const unrecordedCount = rows.filter(r => !r.attendanceStatus).length;

    return {
      classId,
      date,
      totalStudents: students.length,
      presentCount,
      absentCount,
      unrecordedCount,
      students: rows
    };
  }

  /**
   * Mark attendance for a single or multiple students
   */
  markAttendance(payload) {
    const { date, classId, records, course, markedBy } = payload;
    if (!date) {
      throw new Error('Date is required in YYYY-MM-DD format.');
    }
    if (!records || !Array.isArray(records) || records.length === 0) {
      throw new Error('Records must be a non-empty array.');
    }

    const recordsToUpsert = records.map(item => {
      if (!item.roll) throw new Error('Each record must include a student roll number.');
      const status = (item.status || '').toLowerCase();
      if (status !== 'present' && status !== 'absent') {
        throw new Error(`Invalid status "${item.status}" for student ${item.roll}. Must be 'present' or 'absent'.`);
      }
      return {
        roll: item.roll,
        classId: classId || (db.getStudentByRoll(item.roll) ? db.getStudentByRoll(item.roll).classId : 'cse-ai-sem1'),
        date,
        course: course || item.course || 'Core Subject Lecture',
        status,
        markedBy: markedBy || 'Faculty Yash More'
      };
    });

    const saved = db.upsertAttendanceBatch(recordsToUpsert);
    return {
      success: true,
      count: saved.length,
      date,
      classId,
      records: saved
    };
  }

  /**
   * Quick action: Mark all students in a class with a single status (present/absent)
   */
  markAll(classId, date, status, course) {
    const students = db.getStudents({ classId });
    if (students.length === 0) {
      throw new Error(`No students found for class ${classId}.`);
    }

    const records = students.map(s => ({
      roll: s.roll,
      status
    }));

    return this.markAttendance({
      classId,
      date,
      records,
      course: course || 'Core Subject Lecture'
    });
  }

  /**
   * Reset attendance for a specific class and date
   */
  resetAttendance(date, classId) {
    if (!date) {
      throw new Error('Date is required to reset attendance.');
    }
    return db.deleteAttendanceForDate(date, classId);
  }

  /**
   * Get detailed history log for a specific student
   */
  getStudentHistory(roll) {
    const student = db.getStudentByRoll(roll);
    if (!student) {
      throw new Error(`Student with roll ${roll} not found.`);
    }

    const records = db.getAttendanceRecords({ roll });
    // Sort descending by date
    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    const metrics = this.calculateStudentMetrics(student, records);

    return {
      student,
      metrics,
      history: records
    };
  }
}

module.exports = new AttendanceService();
