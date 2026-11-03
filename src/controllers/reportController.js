const attendanceService = require('../services/attendanceService');
const config = require('../config');
const db = require('../database/db');

class ReportController {
  async exportCsv(req, res, next) {
    try {
      const { classId } = req.query;
      const targetClass = classId || 'cse-ai-sem1';
      const studentMetrics = attendanceService.getClassStudentMetrics(targetClass);
      const classInfo = db.getClassById(targetClass);

      const headers = [
        'Roll Number',
        'Student Name',
        'Class',
        'Total Working Days',
        'Days Present',
        'Days Absent',
        'Attendance Percentage',
        'Status',
        'Action Required'
      ];

      const rows = studentMetrics.map(s => [
        `"${s.roll}"`,
        `"${s.name}"`,
        `"${classInfo ? classInfo.name : targetClass}"`,
        s.workingDays,
        s.presentDays,
        s.absentDays,
        `"${s.percentage}%"`,
        `"${s.percentage >= 75 ? 'On Track' : 'At Risk (<75%)'}"`,
        `"${s.isBelowThreshold ? `Attend next ${s.requiredClassesToRecover} classes` : `Buffer: ${s.allowedAbsencesBuffer} classes`}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${targetClass}-${new Date().toISOString().slice(0, 10)}.csv"`);
      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  async getAssignmentCover(req, res, next) {
    try {
      const coverData = {
        assignmentTitle: 'Student Attendance System',
        subjectName: 'Introduction to Generative AI, Principles of Artificial Intelligence',
        courseProgram: 'B.Tech CSE AI',
        studentName: 'Arunkumar Chaudhary',
        rollNumber: '22CA001',
        semester: '1st Semester',
        facultyGuideName: 'Yash More',
        academicYear: '2026-27',
        topic: 'Topic 6 Coding Project 12 Student Directory',
        mustHaveFeatures: [
          { feature: 'Feature 1: Teacher/Admin - Mark Attendance', status: 'Implemented' },
          { feature: 'Feature 2: Student - View personal attendance', status: 'Implemented' },
          { feature: 'Feature 3: Calculate class-wise percentage', status: 'Implemented' },
          { feature: 'Feature 4: Alert for students with low attendance (<75%)', status: 'Implemented' }
        ],
        submissionGuide: {
          liveDeployment: 'Ready for Render, Vercel, or Railway deployment',
          githubRepo: 'Ready for GitHub push with clean documentation',
          screenshotPdf: 'Attendance dashboard and student view ready'
        }
      };

      res.json({ success: true, data: coverData });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ReportController();

