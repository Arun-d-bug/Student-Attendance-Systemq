# AttendEase — Student Attendance System (Backend & Full-Stack Portal)

[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Backend-Production%20Ready-brightgreen.svg)]()
[![Build & Test](https://img.shields.io/badge/Tests-11%2F11%20Passing-success.svg)]()

> **Topic 6 Coding Project 12 · Student Directory**  
> **Student:** Arunkumar Chaudhary (Roll No: `22CA001`)  
> **Course / Program:** B.Tech CSE AI — 1st Semester  
> **Subject / Module:** Introduction to Generative AI, Principles of Artificial Intelligence  
> **Faculty Guide:** Yash More  
> **Academic Year:** 2026–27  

---

## 🏛️ System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Browser                │
                    │   Teacher Dashboard  |  Student Dashboard    │
                    │   Real-Time Toasts   |  Cover Page Modal     │
                    └──────────────────────┬───────────────────────┘
                                           │ HTTP / JSON REST
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │         Express.js Web Application           │
                    │    CORS, JSON Parser, Request Logger         │
                    └───────┬──────────────┬──────────────┬────────┘
                            │              │              │
             ┌──────────────▼──────┐ ┌─────▼──────┐ ┌─────▼───────────────┐
             │ Attendance Service  │ │  Student   │ │ Analytics & Alert   │
             │ - Mark single/bulk  │ │  Service   │ │ - Statutory <75%    │
             │ - Recovery math     │ │  - Metrics │ │ - Class average %   │
             │ - History logs      │ │  - History │ │ - Trends & CSV      │
             └──────────────┬──────┘ └─────┬──────┘ └─────┬───────────────┘
                            │              │              │
                            └──────────────┼──────────────┘
                                           │
                                           ▼
                    ┌──────────────────────────────────────────────┐
                    │            Atomic Storage Engine             │
                    │   - In-memory querying (sub-ms response)     │
                    │   - ACID file persistence (atomic rename)    │
                    │   - JSON data store: data/attendance-db.json │
                    └──────────────────────────────────────────────┘
```

---

## 🚀 Must-Have Features Implementation Matrix

| Requirement | Implementation Detail | Status |
| :--- | :--- | :---: |
| **Feature 1: Teacher/Admin - Mark Attendance** | Multi-class selection, historical date picker, single click Present/Absent marking, batch upsert (`POST /api/attendance/mark`), "Mark All Present/Absent" shortcuts, and reset capabilities. | ✅ **Complete** |
| **Feature 2: Student - View personal attendance** | Individual dashboard with overall attendance %, days present, days absent, total working days, statutory status badge, and complete chronological class attendance log (`GET /api/attendance/student/:roll`). | ✅ **Complete** |
| **Feature 3: Calculate class-wise percentage** | Dynamic aggregation of attendance rates across all historical records and enrolled students. Visualized via progress indicators and KPI overview. | ✅ **Complete** |
| **Feature 4: Alert for students with low attendance (<75%)** | Automated threshold inspection identifying all at-risk students below 75%, prominent alert banners, side card with individual risk indicators, and mathematical recovery calculations. | ✅ **Complete** |

---

## 📡 REST API Reference Documentation

### 1. Attendance Management
- `GET /api/attendance?classId={classId}&date={YYYY-MM-DD}`
  - Returns the attendance matrix for the given class and date.
- `POST /api/attendance/mark`
  - Upserts attendance records for one or multiple students.
  - **Body:**
    ```json
    {
      "date": "2026-11-03",
      "classId": "cse-ai-sem1",
      "records": [
        { "roll": "22CA001", "status": "present" },
        { "roll": "22CA003", "status": "absent" }
      ]
    }
    ```
- `POST /api/attendance/mark-all`
  - Bulk marks all students in a class as `present` or `absent`.
- `DELETE /api/attendance/reset?date={YYYY-MM-DD}&classId={classId}`
  - Clears attendance records for a specific class and date.
- `GET /api/attendance/student/:roll`
  - Retrieves student metrics, attendance rate, and full chronological history log.

### 2. Classes & Students
- `GET /api/classes`
  - Returns all registered academic classes with live student counts and class average %.
- `GET /api/students?classId={classId}`
  - Returns all students with pre-calculated attendance metrics.
- `GET /api/students/:roll`
  - Returns detailed student profile and computed recovery parameters.

### 3. Analytics & Statutory Alerts
- `GET /api/analytics/dashboard?classId={classId}&date={YYYY-MM-DD}`
  - High-level KPIs: Total students, present today, absent today, at-risk count (<75%), class average, and active alert messages.
- `GET /api/analytics/trends?classId={classId}`
  - Historical daily class attendance trend analysis.

### 4. Reports & Exports
- `GET /api/reports/csv?classId={classId}`
  - Streams a fully formatted CSV attendance report ready for Excel / Google Sheets.
- `GET /api/reports/assignment-cover`
  - Returns assignment cover data matching NextWave AI assignment portal specifications.

---

## 🧪 Testing & Verification

The backend includes a comprehensive automated test suite verifying all 11 endpoints, statutory calculations, and recovery algorithms:

```bash
# Run the automated test suite
npm test
```

Test coverage includes:
- System health and metadata validation
- Class and student enrollment verification
- 75% attendance threshold triggers and alert messaging
- Bulk and individual attendance upsert operations
- Real-time percentage recalculations
- Date reset and history consistency
- CSV file generation

---

## 🏃‍♂️ How to Run Locally

### Option 1: Double Click (Windows)
Double-click `start.bat` in the project root folder.

### Option 2: Command Line
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Run automated tests
npm test

# 3. Start the server
npm start
```

Open your browser at: **`http://localhost:3000`**

---

## ☁️ Deployment Guide

### Deploying to Render
1. Push this repository to GitHub.
2. In Render Dashboard, click **New + Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Deploy Web Service**.

### Deploying to Vercel
1. Install Vercel CLI or import GitHub repo on [vercel.com](https://vercel.com).
2. The project will automatically serve `public/` and Express API endpoints.
