// Generate historical academic working days leading up to today
function generateAcademicDates(count = 22) {
  const dates = [];
  let d = new Date('2026-11-02'); // yesterday or recent past
  while (dates.length < count) {
    const day = d.getDay();
    // Monday to Friday are working days
    if (day !== 0 && day !== 6) {
      dates.push(d.toISOString().slice(0, 10));
    }
    d.setDate(d.getDate() - 1);
  }
  return dates.reverse(); // oldest to newest
}

function getSeedData() {
  const dates = generateAcademicDates(22);

  const classes = [
    {
      id: 'cse-ai-sem1',
      name: 'B.Tech CSE AI — Semester 1',
      code: 'CSE-AI-S1',
      department: 'Computer Science & AI',
      semester: '1st Semester',
      facultyGuide: 'Yash More'
    },
    {
      id: 'cse-sem1',
      name: 'B.Tech CSE — Semester 1',
      code: 'CSE-S1',
      department: 'Computer Science & Engineering',
      semester: '1st Semester',
      facultyGuide: 'Dr. Suresh Kumar'
    }
  ];

  const students = [
    {
      roll: '22CA001',
      name: 'Arunkumar Chaudhary',
      email: 'arunkumar.c@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 18
    },
    {
      roll: '22CA002',
      name: 'Aarav Sharma',
      email: 'aarav.s@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 20
    },
    {
      roll: '22CA003',
      name: 'Ananya Singh',
      email: 'ananya.s@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 15
    },
    {
      roll: '22CA004',
      name: 'Diya Patel',
      email: 'diya.p@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 19
    },
    {
      roll: '22CA005',
      name: 'Ishaan Verma',
      email: 'ishaan.v@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 14
    },
    {
      roll: '22CA006',
      name: 'Kavya Mehta',
      email: 'kavya.m@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 21
    },
    {
      roll: '22CA007',
      name: 'Rohan Gupta',
      email: 'rohan.g@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 17
    },
    {
      roll: '22CA008',
      name: 'Sana Khan',
      email: 'sana.k@college.edu',
      classId: 'cse-ai-sem1',
      semester: '1st Semester',
      targetPresent: 20
    },
    // CSE students
    {
      roll: '22CS001',
      name: 'Aditya Rao',
      email: 'aditya.r@college.edu',
      classId: 'cse-sem1',
      semester: '1st Semester',
      targetPresent: 19
    },
    {
      roll: '22CS002',
      name: 'Meera Nair',
      email: 'meera.n@college.edu',
      classId: 'cse-sem1',
      semester: '1st Semester',
      targetPresent: 16
    },
    {
      roll: '22CS003',
      name: 'Rahul Deshmukh',
      email: 'rahul.d@college.edu',
      classId: 'cse-sem1',
      semester: '1st Semester',
      targetPresent: 13
    },
    {
      roll: '22CS004',
      name: 'Sneha Reddy',
      email: 'sneha.r@college.edu',
      classId: 'cse-sem1',
      semester: '1st Semester',
      targetPresent: 21
    }
  ];

  // Subject courses schedule
  const courses = [
    'Introduction to AI',
    'Programming Fundamentals',
    'Mathematics I',
    'Digital Electronics',
    'Data Structures & Algorithms'
  ];

  // Generate deterministic realistic historical attendance logs
  const attendanceRecords = [];
  let recordId = 1;

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const course = courses[i % courses.length];

    for (const s of students) {
      // Deterministically distribute absents to achieve targetPresent out of 22
      const targetAbsents = 22 - s.targetPresent;
      // Stride out absent days
      let isAbsent = false;
      if (targetAbsents > 0) {
        const step = Math.floor(22 / targetAbsents);
        isAbsent = (i % step === 1) && (attendanceRecords.filter(r => r.roll === s.roll && r.status === 'absent').length < targetAbsents);
      }

      const status = isAbsent ? 'absent' : 'present';

      attendanceRecords.push({
        id: `att_${recordId++}`,
        roll: s.roll,
        classId: s.classId,
        date: date,
        course: course,
        status: status,
        markedBy: 'Faculty Yash More',
        updatedAt: `${date}T10:00:00.000Z`
      });
    }
  }

  // Sanitize students object for storage
  const cleanStudents = students.map(({ targetPresent, ...rest }) => rest);

  return {
    classes,
    students: cleanStudents,
    attendanceRecords,
    meta: {
      initializedAt: new Date().toISOString(),
      version: '1.0.0',
      totalWorkingDays: dates.length
    }
  };
}

module.exports = {
  getSeedData,
  generateAcademicDates
};

