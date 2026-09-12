# Kings Academy International Management System Documentation

## 1. Project Overview
The Kings Academy International Management System is a comprehensive web-based application designed to streamline school operations, academic tracking, and communication between administrators, teachers, and parents. The system provides role-based access, ensuring that each user has a tailored experience relevant to their responsibilities.

### Core Objectives:
- Centralize student and teacher management.
- Automate academic result tracking and reporting.
- Facilitate real-time attendance monitoring.
- Manage school-wide announcements and notifications.
- Track financial records, including billing and payment histories.

---

## 2. System Architecture
The application is built using a modern decoupled architecture:

- **Frontend**: Standard HTML5, CSS3 (with custom variables for styling), and Vanilla JavaScript.
- **Backend API**: PHP-based RESTful API located in the `/api` directory.
- **Database**: MySQL database for persistent storage (`database.sql`).
- **Authentication**: Custom session management using `localStorage` and PHP-based validation (`js/auth.js` and `api/auth.php`).
- **Communication**: All frontend interactions are mediated through a centralized `ApiClient` (`js/api.js`).

---

## 3. Module-wise Page Breakdown

### 3.1. Management (Admin) Portal
Accessible via `/management/dashboard.html`. Admins have full control over the system's data and configuration.

| Page | Functionality |
| :--- | :--- |
| **Dashboard** | Overview of system stats (Total Students, Teachers, Classes) and recent announcements. |
| **Students & Parents** | View, edit, and add student records. Links students to their respective parent accounts. |
| **Teachers** | Manage teacher profiles, assigned subjects, and mentorship class assignments. |
| **Announcements** | Create and broadcast school-wide or group-specific (Teachers/Parents) updates. |
| **Timetable Import** | Upload and manage CSV/Excel structured data for class schedules. |
| **Results Manager** | Oversee and validated examination marks across all classes. |
| **Finance Manager** | Create fee structures, bill individual students, and track payment histories. |

### 3.2. Teacher Portal
Accessible via `/teacher/dashboard.html`. Teachers focus on academic delivery and student tracking.

| Page | Functionality |
| :--- | :--- |
| **Dashboard & Profile** | View personal profile info, assigned subjects, and quick access to the timetable. |
| **My Timetable** | Chronological view of the teacher's weekly teaching schedule. |
| **Class Attendance** | Mark student attendance for specific lessons and subjects. |
| **Morning Attendance** | Track daily early-morning presence for students in their mentorship class. |
| **Assignments** | Post homework, upload resource links, and track student submissions. |
| **Exam Results** | Input and manage student marks for mid-term and end-of-term assessments. |

### 3.3. Parent Portal
Accessible via `/parent/dashboard.html`. Parents get real-time insights into their child's progress.

| Page | Functionality |
| :--- | :--- |
| **Ward Dashboard** | Summary of the child's academic status, today's attendance, and outstanding fees. |
| **Fee Statement** | Detailed breakdown of billed items and a history of all payments made. |
| **Attendance Records** | Historical data of the student's presence in class and at school. |
| **Student Timetable** | View the child's daily class schedule and subjects. |
| **Assignments** | Monitor upcoming tasks and check the completion status of homework. |
| **Term Results** | View and download term progress reports and final grades. |

---

## 4. Key Functions & Logic

### Authentication System
The system uses role-based access control (RBAC). 
- **Roles**: `management`, `teacher`, `parent`.
- **Logic**: Upon login, a session object is stored in `localStorage`. The `Auth.requireAuth(['role'])` function is called on every page to prevent unauthorized access.

### API Integration
All data requests are handled via the `ApiClient` class in `js/api.js`. This class handles:
- URL construction to the `/api` directory.
- JSON serialization/deserialization.
- Error handling and visual feedback (Toasts).

### Financial Calculations
- **Balance Due**: Calculated by subtracting `amount_paid` from `amount_billed` across all financial records for a specific student ID.
- **Reporting**: Generates print-friendly fee statements for parents.

---

## 5. Database Schema Overview
The database `school_management` contains several related tables:
- **`users`**: Stores login credentials, roles, and profile information.
- **`students`**: Basic student data, linked to parents.
- **`attendance`**: Daily and lesson-based attendance logs.
- **`assignments`**: Homework and classroom tasks.
- **`timetables`**: Class and teacher schedules.
- **`financials`**: Billing and payment records.
- **`results`**: Detailed academic scores and grades.

---

## 6. Installation & Setup

1. **Clone/Copy** the project folder to `c:\XAMP\htdocs\school`.
2. **Database Import**:
   - Open PHPMyAdmin.
   - Create a new database named `school_management`.
   - Import the `database.sql` file provided in the project root.
3. **Configuration**:
   - Verify that `api/db.php` has the correct database credentials (defaults to `root` with no password).
4. **Access**:
   - Navigate to `http://localhost/school/` in your browser.
   - Use the demo credentials provided on the login page.
