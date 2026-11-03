const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getSeedData } = require('./seedData');

class DatabaseStore {
  constructor(dbFilePath = config.dbPath) {
    this.filePath = dbFilePath;
    this.data = null;
    this.isWriting = false;
    this.writeQueue = [];
    this.init();
  }

  init() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure collections exist
        if (!this.data.classes) this.data.classes = [];
        if (!this.data.students) this.data.students = [];
        if (!this.data.attendanceRecords) this.data.attendanceRecords = [];
        return;
      } catch (err) {
        console.error('Failed to parse database file, resetting to seed data:', err.message);
      }
    }

    // Seed database if file doesn't exist or is corrupt
    this.resetToSeed();
  }

  resetToSeed() {
    const seed = getSeedData();
    this.data = seed;
    this.persistSync();
    console.log(`[Database] Initialized with seed data at: ${this.filePath}`);
  }

  persistSync() {
    const tempPath = `${this.filePath}.${Date.now()}.tmp`;
    const serialized = JSON.stringify(this.data, null, 2);
    try {
      fs.writeFileSync(tempPath, serialized, 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err) {
      if (fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch (_) {}
      }
      throw err;
    }
  }

  // Accessors
  getClasses() {
    return this.data.classes;
  }

  getClassById(classId) {
    return this.data.classes.find(c => c.id === classId);
  }

  getStudents(filter = {}) {
    let result = [...this.data.students];
    if (filter.classId) {
      result = result.filter(s => s.classId === filter.classId);
    }
    if (filter.roll) {
      result = result.filter(s => s.roll === filter.roll);
    }
    return result;
  }

  getStudentByRoll(roll) {
    return this.data.students.find(s => s.roll.toLowerCase() === roll.toLowerCase());
  }

  getAttendanceRecords(filter = {}) {
    let result = [...this.data.attendanceRecords];
    if (filter.classId) {
      result = result.filter(r => r.classId === filter.classId);
    }
    if (filter.date) {
      result = result.filter(r => r.date === filter.date);
    }
    if (filter.roll) {
      result = result.filter(r => r.roll.toLowerCase() === filter.roll.toLowerCase());
    }
    return result;
  }

  // Bulk or single attendance upsert
  upsertAttendanceBatch(records) {
    const updated = [];
    for (const rec of records) {
      const existingIndex = this.data.attendanceRecords.findIndex(
        r => r.roll.toLowerCase() === rec.roll.toLowerCase() && r.date === rec.date
      );

      const recordToSave = {
        id: existingIndex >= 0 ? this.data.attendanceRecords[existingIndex].id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        roll: rec.roll,
        classId: rec.classId || (this.getStudentByRoll(rec.roll) ? this.getStudentByRoll(rec.roll).classId : 'cse-ai-sem1'),
        date: rec.date,
        course: rec.course || 'Core Subject Lecture',
        status: rec.status, // 'present' or 'absent'
        markedBy: rec.markedBy || 'Faculty Yash More',
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        this.data.attendanceRecords[existingIndex] = recordToSave;
      } else {
        this.data.attendanceRecords.push(recordToSave);
      }
      updated.push(recordToSave);
    }

    this.persistSync();
    return updated;
  }

  // Reset/delete attendance for a given date and class
  deleteAttendanceForDate(date, classId) {
    const beforeCount = this.data.attendanceRecords.length;
    this.data.attendanceRecords = this.data.attendanceRecords.filter(r => {
      if (classId) {
        return !(r.date === date && r.classId === classId);
      }
      return r.date !== date;
    });

    const deletedCount = beforeCount - this.data.attendanceRecords.length;
    this.persistSync();
    return { deletedCount };
  }

  // Add a new student
  addStudent(studentData) {
    const existing = this.getStudentByRoll(studentData.roll);
    if (existing) {
      throw new Error(`Student with roll ${studentData.roll} already exists.`);
    }
    const student = {
      roll: studentData.roll.trim(),
      name: studentData.name.trim(),
      email: studentData.email || `${studentData.roll.toLowerCase()}@college.edu`,
      classId: studentData.classId || 'cse-ai-sem1',
      semester: studentData.semester || '1st Semester'
    };
    this.data.students.push(student);
    this.persistSync();
    return student;
  }
}

// Singleton database instance
const db = new DatabaseStore();

module.exports = db;
