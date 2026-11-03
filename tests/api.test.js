const assert = require('node:assert');
const { EventEmitter } = require('node:events');
const app = require('../src/app');

// In-process HTTP request mock for sandbox-safe testing without TCP socket binding
function mockRequest(method, urlStr, bodyData = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr, 'http://localhost');
    const path = url.pathname + url.search;

    const req = new EventEmitter();
    req.method = method.toUpperCase();
    req.url = path;
    req.originalUrl = path;
    req.headers = {
      'content-type': 'application/json',
      'host': 'localhost'
    };
    req.query = Object.fromEntries(url.searchParams.entries());

    const res = new EventEmitter();
    let statusCode = 200;
    const headers = {};
    let responseBody = '';

    res.statusCode = statusCode;
    res.setHeader = (key, val) => { headers[key.toLowerCase()] = val; };
    res.getHeader = (key) => headers[key.toLowerCase()];
    res.status = (code) => { res.statusCode = code; return res; };
    res.send = (data) => {
      responseBody = data;
      res.emit('finish');
      finish();
      return res;
    };
    res.json = (data) => {
      headers['content-type'] = 'application/json';
      responseBody = JSON.stringify(data);
      res.emit('finish');
      finish();
      return res;
    };
    res.end = (chunk) => {
      if (chunk) responseBody += chunk;
      res.emit('finish');
      finish();
      return res;
    };

    function finish() {
      let parsed = responseBody;
      if (headers['content-type'] && headers['content-type'].includes('application/json')) {
        try { parsed = JSON.parse(responseBody); } catch (_) { }
      }
      resolve({ status: res.statusCode, headers, body: parsed });
    }

    // Pass to Express
    try {
      app(req, res);
      if (bodyData) {
        req.emit('data', Buffer.from(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData)));
      }
      req.emit('end');
    } catch (err) {
      reject(err);
    }
  });
}

// Or we can test the service layer & Express endpoints directly
const attendanceService = require('../src/services/attendanceService');
const analyticsService = require('../src/services/analyticsService');
const db = require('../src/database/db');

async function runTestSuite() {
  console.log('🧪 Starting AttendEase Backend Production Test Suite...\n');

  // Test 1: Health check
  console.log('Test 1: GET /api/health');
  const healthRes = await mockRequest('GET', '/api/health');
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthRes.body.status, 'healthy');
  console.log('  ✔ Health check passed');

  // Test 2: Classes
  console.log('Test 2: GET /api/classes');
  const classesRes = await mockRequest('GET', '/api/classes');
  assert.strictEqual(classesRes.status, 200);
  assert.strictEqual(classesRes.body.success, true);
  assert.ok(classesRes.body.data.length >= 2, 'Should have at least 2 classes');
  const cseAi = classesRes.body.data.find(c => c.id === 'cse-ai-sem1');
  assert.ok(cseAi, 'B.Tech CSE AI class must exist');
  assert.strictEqual(cseAi.totalStudents, 8, 'CSE AI should have 8 students');
  console.log(`  ✔ Found ${classesRes.body.data.length} classes, CSE AI has 8 students`);

  // Test 3: Dashboard Analytics
  console.log('Test 3: Dashboard Summary Calculation');
  const dashRes = await mockRequest('GET', '/api/analytics/dashboard?classId=cse-ai-sem1');
  assert.strictEqual(dashRes.status, 200);
  const { metrics, alert } = dashRes.body.data;
  assert.strictEqual(metrics.totalStudents, 8);
  assert.strictEqual(metrics.lowCount, 2, 'Should identify 2 students below 75%');
  assert.strictEqual(alert.hasAlert, true);
  assert.strictEqual(alert.students.length, 2);
  console.log(`  ✔ Analytics accurate: Total: ${metrics.totalStudents}, Low: ${metrics.lowCount}, Class Avg: ${metrics.classAverage}%`);

  // Test 4: Arunkumar Chaudhary's personal attendance metrics
  console.log('Test 4: GET /api/students/22CA001');
  const studentRes = await mockRequest('GET', '/api/students/22CA001');
  assert.strictEqual(studentRes.status, 200);
  const arun = studentRes.body.data;
  assert.strictEqual(arun.student.name, 'Arunkumar Chaudhary');
  assert.strictEqual(arun.metrics.presentDays, 18);
  assert.strictEqual(arun.metrics.workingDays, 22);
  assert.strictEqual(arun.metrics.percentage, 82);
  assert.strictEqual(arun.metrics.status, 'on_track');
  console.log(`  ✔ Student 22CA001 verified: 18/22 days = ${arun.metrics.percentage}% (On Track)`);

  // Test 5: At-risk students identification
  console.log('Test 5: Verify students below 75% (Feature 4 Alert requirement)');
  const ananyaRes = await mockRequest('GET', '/api/students/22CA003');
  assert.strictEqual(ananyaRes.body.data.metrics.percentage, 68);
  assert.strictEqual(ananyaRes.body.data.metrics.status, 'at_risk');
  assert.ok(ananyaRes.body.data.metrics.requiredClassesToRecover > 0);
  console.log(`  ✔ Ananya Singh verified: ${ananyaRes.body.data.metrics.percentage}% (<75%, Needs ${ananyaRes.body.data.metrics.requiredClassesToRecover} consecutive classes to recover)`);

  // Test 6: Marking attendance for a date
  console.log('Test 6: POST /api/attendance/mark');
  const testDate = '2026-11-03';
  const markRes = attendanceService.markAttendance({
    date: testDate,
    classId: 'cse-ai-sem1',
    records: [
      { roll: '22CA001', status: 'present' },
      { roll: '22CA002', status: 'present' },
      { roll: '22CA003', status: 'absent' }
    ]
  });
  assert.strictEqual(markRes.success, true);
  assert.strictEqual(markRes.count, 3);
  console.log('  ✔ Marked attendance for 3 students successfully');

  // Test 7: Verify attendance read back for date
  console.log('Test 7: Read back attendance for date');
  const getAttRes = attendanceService.getClassAttendanceByDate('cse-ai-sem1', testDate);
  const arunRow = getAttRes.students.find(s => s.roll === '22CA001');
  assert.strictEqual(arunRow.attendanceStatus, 'present');
  const ananyaRow = getAttRes.students.find(s => s.roll === '22CA003');
  assert.strictEqual(ananyaRow.attendanceStatus, 'absent');
  console.log('  ✔ Attendance status retrieved accurately from database');

  // Test 8: Reset attendance for date
  console.log('Test 8: Reset attendance for date');
  const resetRes = attendanceService.resetAttendance(testDate, 'cse-ai-sem1');
  assert.ok(resetRes.deletedCount >= 3);
  console.log('  ✔ Attendance reset successfully');

  // Test 9: Student history
  console.log('Test 9: Student attendance history log');
  const histRes = attendanceService.getStudentHistory('22CA001');
  assert.ok(histRes.history.length >= 22);
  console.log(`  ✔ Student history returned ${histRes.history.length} records`);

  // Test 10: CSV export
  console.log('Test 10: GET /api/reports/csv');
  const csvRes = await mockRequest('GET', '/api/reports/csv?classId=cse-ai-sem1');
  assert.strictEqual(csvRes.status, 200);
  assert.ok(csvRes.body.includes('Roll Number'));
  assert.ok(csvRes.body.includes('22CA001'));
  console.log('  ✔ CSV export generated properly');

  // Test 11: Assignment Cover Page Builder metadata
  console.log('Test 11: GET /api/reports/assignment-cover');
  const coverRes = await mockRequest('GET', '/api/reports/assignment-cover');
  assert.strictEqual(coverRes.status, 200);
  assert.strictEqual(coverRes.body.data.studentName, 'Arunkumar Chaudhary');
  assert.strictEqual(coverRes.body.data.facultyGuideName, 'Yash More');
  assert.strictEqual(coverRes.body.data.mustHaveFeatures.length, 4);
  console.log('  ✔ Assignment Cover metadata matches screenshot specifications');

  console.log('\n🎉 ALL 11 TESTS PASSED SUCCESSFULLY! 100% GREEN.');
}

runTestSuite().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
