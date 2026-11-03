const path = require('path');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  attendanceThresholdPct: 75,
  dbPath: path.resolve(__dirname, '../data/attendance-db.json'),
  corsOrigins: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  projectMeta: {
    title: 'AttendEase — Student Attendance System',
    topic: 'Topic 6 Coding Project 12 Student Directory',
    student: {
      name: 'Arunkumar Chaudhary',
      roll: '22CA001',
      course: 'B.Tech CSE AI',
      semester: '1st Semester'
    },
    faculty: {
      name: 'Yash More'
    },
    version: '1.0.0'
  }
};

module.exports = config;

