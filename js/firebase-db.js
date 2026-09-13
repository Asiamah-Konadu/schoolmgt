// Firebase Direct Database Layer
// Connects directly to Google Cloud Firestore (schoolmgt-6fcfb)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase App & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export class FirebaseDB {
  static get db() {
    return db;
  }

  // ── 1. AUTHENTICATION ─────────────────────────────────────────
  static async login(idOrEmail, password, role) {
    try {
      const usersCol = collection(db, "users");
      // Query by ID first
      let q = query(usersCol, where("id", "==", idOrEmail.trim()));
      let snap = await getDocs(q);

      // If not found by ID, query by email
      if (snap.empty) {
        q = query(usersCol, where("email", "==", idOrEmail.trim().toLowerCase()));
        snap = await getDocs(q);
      }

      if (snap.empty) {
        throw new Error("Invalid username or password");
      }

      const userDoc = snap.docs[0];
      const user = userDoc.data();

      // Check role
      if (role && role !== "any" && user.role !== role) {
        throw new Error(`Role mismatch. This account is registered as ${user.role}.`);
      }

      // Check password
      if (user.password !== password) {
        throw new Error("Invalid password");
      }

      const safeUser = { ...user };
      delete safeUser.password;

      // If parent, fetch wards
      if (user.role === "parent") {
        const studentsQ = query(collection(db, "students"), where("parent_id", "==", user.id));
        const studentsSnap = await getDocs(studentsQ);
        safeUser.studentIds = studentsSnap.docs.map(d => d.id);
      }

      return safeUser;
    } catch (err) {
      console.warn("Direct Firebase login error, attempting fallback:", err.message);
      throw err;
    }
  }

  // ── 2. MANAGEMENT: STATS ──────────────────────────────────────
  static async getStats() {
    const studentsSnap = await getDocs(collection(db, "students"));
    const teachersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
    
    const classes = new Set();
    studentsSnap.forEach(d => {
      const data = d.data();
      if (data.class_name) classes.add(data.class_name);
    });

    return {
      students: studentsSnap.size,
      teachers: teachersSnap.size,
      classes: classes.size
    };
  }

  // ── 3. ANNOUNCEMENTS ──────────────────────────────────────────
  static async getAnnouncements() {
    const q = query(collection(db, "announcements"), orderBy("created_at", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async createAnnouncement(title, content, target) {
    const id = "A" + Math.floor(1000 + Math.random() * 9000);
    const data = {
      id,
      title,
      content,
      target_audience: target,
      created_at: new Date().toISOString()
    };
    await setDoc(doc(db, "announcements", id), data);
    return data;
  }

  static async deleteAnnouncement(id) {
    await deleteDoc(doc(db, "announcements", id));
  }

  // ── 4. STUDENTS & PARENTS ─────────────────────────────────────
  static async getStudents() {
    const snap = await getDocs(collection(db, "students"));
    const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch parent names
    const parentIds = [...new Set(students.map(s => s.parent_id).filter(Boolean))];
    const parentMap = {};

    for (const pid of parentIds) {
      const pDoc = await getDoc(doc(db, "users", pid));
      if (pDoc.exists()) {
        parentMap[pid] = pDoc.data().name;
      }
    }

    return students.map(s => ({
      id: s.id,
      name: s.name,
      class: s.class_name || s.class,
      parentId: s.parent_id,
      parentName: parentMap[s.parent_id] || "Unlinked"
    }));
  }

  static async createStudentParent({ studentName, assignedClass, parentName, parentPhone }) {
    const pId = "PAR" + Math.floor(1000 + Math.random() * 9000);
    const sId = "STU" + Math.floor(1000 + Math.random() * 9000);

    const parentData = {
      id: pId,
      name: parentName,
      password: parentPhone,
      role: "parent",
      phone: parentPhone,
      created_at: new Date().toISOString()
    };

    const studentData = {
      id: sId,
      name: studentName,
      class_name: assignedClass,
      parent_id: pId,
      promotion_status: "none",
      created_at: new Date().toISOString()
    };

    await setDoc(doc(db, "users", pId), parentData);
    await setDoc(doc(db, "students", sId), studentData);

    return { parentId: pId, studentId: sId };
  }

  static async deleteStudent(id) {
    await deleteDoc(doc(db, "students", id));
  }

  // ── 5. TEACHERS ───────────────────────────────────────────────
  static async getTeachers() {
    const q = query(collection(db, "users"), where("role", "==", "teacher"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async createTeacher({ name, email, subjects, assignedClass }) {
    const tId = "TCH" + Math.floor(1000 + Math.random() * 9000);
    const teacherData = {
      id: tId,
      name,
      email: email.toLowerCase(),
      password: "password123",
      role: "teacher",
      subjects: Array.isArray(subjects) ? subjects : subjects.split(",").map(s => s.trim()),
      assignedClass: assignedClass || null,
      created_at: new Date().toISOString()
    };

    await setDoc(doc(db, "users", tId), teacherData);
    return { teacherId: tId };
  }

  static async deleteTeacher(id) {
    await deleteDoc(doc(db, "users", id));
  }

  // ── Notification helpers ───────────────────────────────────────
  static async getNotifications(userId) {
    const q = query(collection(db, "notifications"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }

  static async markNotificationRead(id, userId) {
    const ref = doc(db, "notifications", id);
    await updateDoc(ref, { is_read: 1, updated_at: new Date().toISOString() });
  }

  static async markAllNotificationsRead(userId) {
    const q = query(collection(db, "notifications"), where("user_id", "==", userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, "notifications", d.id), { is_read: 1, updated_at: new Date().toISOString() });
    }
    return { updated: snap.size };
  }

  // ── 6. TIMETABLES ─────────────────────────────────────────────
  static async getAllTimetables() {
    const snap = await getDocs(collection(db, "timetables"));
    const timetables = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Attach teacher names
    const teacherMap = {};
    const teachersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
    teachersSnap.forEach(d => {
      const t = d.data();
      teacherMap[t.id] = t.name;
    });

    return timetables.map(t => ({
      ...t,
      teacherName: teacherMap[t.teacher_id] || t.teacher_id
    }));
  }

  static async getTimetableForTeacher(teacherId) {
    const q = query(collection(db, "timetables"), where("teacher_id", "==", teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async getTimetableForClass(className) {
    const q = query(collection(db, "timetables"), where("class_name", "==", className));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const teacherMap = {};
    const teachersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
    teachersSnap.forEach(d => {
      const t = d.data();
      teacherMap[t.id] = t.name;
    });

    return list.map(t => ({
      ...t,
      teacherName: teacherMap[t.teacher_id] || t.teacher_id
    }));
  }

  static async importTimetable(rows) {
    let inserted = 0;
    let skipped = 0;

    for (const row of rows) {
      const id = "TT" + Math.random().toString(36).substring(2, 9).toUpperCase();
      const data = {
        id,
        class_name: row.class_name,
        day: row.day,
        time_slot: row.time_slot,
        subject: row.subject,
        teacher_id: row.teacher_id,
        created_at: new Date().toISOString()
      };
      await setDoc(doc(db, "timetables", id), data);
      inserted++;
    }

    return { inserted, skipped };
  }

  static async deleteTimetable(id) {
    await deleteDoc(doc(db, "timetables", id));
  }

  // ── 7. FINANCIALS ─────────────────────────────────────────────
  static async getAllFinancials() {
    const snap = await getDocs(collection(db, "financials"));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const studentMap = {};
    const studentsSnap = await getDocs(collection(db, "students"));
    studentsSnap.forEach(d => {
      const s = d.data();
      studentMap[s.id] = { name: s.name, class_name: s.class_name };
    });

    return list
      .map(f => {
        const student = studentMap[f.student_id] || { name: "Unknown", class_name: "Unknown" };
        return {
          ...f,
          student_name: student.name,
          class_name: student.class_name
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  static async getFinancials(studentId) {
    const q = query(collection(db, "financials"), where("student_id", "==", studentId), orderBy("created_at", "desc"));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch(e) {
      // Fallback query without orderBy in case composite index is building
      const qSimple = query(collection(db, "financials"), where("student_id", "==", studentId));
      const snap = await getDocs(qSimple);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      return list;
    }
  }

  static async addFinancial(data) {
    const id = "FIN" + Math.floor(10000 + Math.random() * 90000);
    const entry = {
      id,
      student_id: data.studentId,
      description: data.description,
      amount_billed: parseFloat(data.amountBilled) || 0,
      amount_paid: parseFloat(data.amountPaid) || 0,
      term: data.term || "First Term",
      academic_year: data.academicYear || "2025/2026",
      created_at: new Date().toISOString()
    };
    await setDoc(doc(db, "financials", id), entry);
    return { id };
  }

  static async deleteFinancial(id) {
    await deleteDoc(doc(db, "financials", String(id)));
  }

  // ── 8. RESULTS ────────────────────────────────────────────────
  static async getResultPeriods() {
    const snap = await getDocs(collection(db, "results"));
    const map = new Map();
    snap.docs.forEach(d => {
      const r = d.data();
      if (!r.term || !r.academic_year) return;
      const key = `${r.term}::${r.academic_year}`;
      if (!map.has(key)) {
        map.set(key, { term: r.term, academic_year: r.academic_year });
      }
    });
    return Array.from(map.values()).sort((a, b) => b.academic_year.localeCompare(a.academic_year));
  }

  static async submitResults({ teacherId, subject, term, academic_year, records }) {
    let saved = 0;
    for (const rec of records) {
      const exam = parseFloat(rec.exam_score) || 0;
      const proj = parseFloat(rec.project_score) || 0;
      const grp = parseFloat(rec.group_score) || 0;
      const assign = parseFloat(rec.assignment_score) || 0;

      const total = Number(((exam * 0.6) + (proj * 0.1) + (grp * 0.1) + (assign * 0.2)).toFixed(2));
      let grade = "F";
      let remarks = "Fail – Needs Improvement";
      if (total >= 80) { grade = "A"; remarks = "Excellent"; }
      else if (total >= 70) { grade = "B"; remarks = "Very Good"; }
      else if (total >= 60) { grade = "C"; remarks = "Good"; }
      else if (total >= 50) { grade = "D"; remarks = "Average"; }
      else if (total >= 40) { grade = "E"; remarks = "Below Average"; }

      const id = "RES_" + rec.student_id + "_" + subject.replace(/\s+/g, '_') + "_" + term.replace(/\s+/g, '_') + "_" + academic_year.replace(/[\/\s]+/g, '_');

      const data = {
        id,
        student_id: rec.student_id,
        teacher_id: teacherId,
        subject,
        term,
        academic_year,
        exam_score: exam,
        project_score: proj,
        group_score: grp,
        assignment_score: assign,
        total_score: total,
        grade,
        remarks,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, "results", id), data, { merge: true });
      saved++;
    }
    return { saved };
  }

  static async getClassResults(className, subject, term, year) {
    const studentsSnap = await getDocs(query(collection(db, "students"), where("class_name", "==", className)));
    const studentMap = {};
    studentsSnap.forEach(d => { studentMap[d.id] = d.data().name; });

    const resultsSnap = await getDocs(
      query(collection(db, "results"), where("subject", "==", subject), where("term", "==", term), where("academic_year", "==", year))
    );

    const list = [];
    resultsSnap.forEach(d => {
      const data = d.data();
      if (studentMap[data.student_id]) {
        list.push({ ...data, student_name: studentMap[data.student_id] });
      }
    });

    return list;
  }

  static async getStudentResults(studentId, term, year) {
    const q = query(
      collection(db, "results"), 
      where("student_id", "==", studentId), 
      where("term", "==", term), 
      where("academic_year", "==", year)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async getAllResults(term, year) {
    const snap = await getDocs(
      query(collection(db, "results"), where("term", "==", term), where("academic_year", "==", year))
    );
    
    // Group by student
    const studentMap = {};
    const studentsSnap = await getDocs(collection(db, "students"));
    studentsSnap.forEach(d => {
      const s = d.data();
      studentMap[s.id] = { name: s.name, class_name: s.class_name };
    });

    const groups = {};
    snap.forEach(d => {
      const r = d.data();
      if (!groups[r.student_id]) {
        const stu = studentMap[r.student_id] || { name: "Unknown", class_name: "N/A" };
        groups[r.student_id] = {
          student_id: r.student_id,
          student_name: stu.name,
          class_name: stu.class_name,
          term: r.term,
          academic_year: r.academic_year,
          subject_count: 0,
          total_sum: 0
        };
      }
      groups[r.student_id].subject_count++;
      groups[r.student_id].total_sum += parseFloat(r.total_score || 0);
    });

    return Object.values(groups).map(g => ({
      ...g,
      average_score: g.subject_count > 0 ? (g.total_sum / g.subject_count).toFixed(1) : 0
    }));
  }

  // ── 9. ATTENDANCE ─────────────────────────────────────────────
  static async submitLessonAttendance({ teacherId, className, subject, students }) {
    const date = new Date().toISOString().split("T")[0];

    // Mark teacher
    const tAttId = "TATT_" + teacherId + "_" + className + "_" + date;
    await setDoc(doc(db, "teacher_attendance", tAttId), {
      id: tAttId,
      teacher_id: teacherId,
      class_name: className,
      subject,
      date,
      created_at: new Date().toISOString()
    });

    // Mark students
    for (const stu of students) {
      const sAttId = "ATT_" + stu.id + "_" + subject.replace(/\s+/g, '_') + "_" + date;
      await setDoc(doc(db, "attendance", sAttId), {
        id: sAttId,
        student_id: stu.id,
        type: "lesson",
        subject,
        teacher_id: teacherId,
        is_present: stu.isPresent ? 1 : 0,
        date,
        created_at: new Date().toISOString()
      });
    }
  }

  static async submitMorningAttendance({ teacherId, studentId }) {
    const date = new Date().toISOString().split("T")[0];
    const sAttId = "MATT_" + studentId + "_" + date;
    await setDoc(doc(db, "attendance", sAttId), {
      id: sAttId,
      student_id: studentId,
      type: "morning",
      teacher_id: teacherId,
      is_present: 1,
      date,
      created_at: new Date().toISOString()
    });

    // Fetch parent phone
    const stuDoc = await getDoc(doc(db, "students", studentId));
    let parentPhone = null;
    if (stuDoc.exists() && stuDoc.data().parent_id) {
      const pDoc = await getDoc(doc(db, "users", stuDoc.data().parent_id));
      if (pDoc.exists()) {
        parentPhone = pDoc.data().phone;
      }
    }
    return { parentPhone };
  }

  static async getMorningRoster(className) {
    const studentsSnap = await getDocs(query(collection(db, "students"), where("class_name", "==", className)));
    const date = new Date().toISOString().split("T")[0];

    const list = [];
    for (const d of studentsSnap.docs) {
      const stu = d.data();
      const sAttId = "MATT_" + stu.id + "_" + date;
      const attDoc = await getDoc(doc(db, "attendance", sAttId));
      list.push({
        id: stu.id,
        name: stu.name,
        arrival_time: attDoc.exists() ? attDoc.data().created_at : null
      });
    }
    return list;
  }

  static async getStudentAttendance(studentId) {
    const q = query(collection(db, "attendance"), where("student_id", "==", studentId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }

  static async getTeacherAttendance(className) {
    const q = query(collection(db, "teacher_attendance"), where("class_name", "==", className));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const teacherMap = {};
    const teachersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "teacher")));
    teachersSnap.forEach(d => {
      const t = d.data();
      teacherMap[t.id] = t.name;
    });

    return list.map(ta => ({
      ...ta,
      teacherName: teacherMap[ta.teacher_id] || ta.teacher_id
    }));
  }

  // ── 10. ASSIGNMENTS ───────────────────────────────────────────
  static async getMyAssignments(teacherId) {
    const q = query(collection(db, "assignments"), where("teacher_id", "==", teacherId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }

  static async getAssignments(className) {
    const q = query(collection(db, "assignments"), where("class_name", "==", className));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => new Date(a.due_date || 0) - new Date(b.due_date || 0));
    return list;
  }

  static async createAssignment(data) {
    const id = "ASG" + Math.floor(1000 + Math.random() * 9000);
    const ass = {
      id,
      teacher_id: data.teacherId,
      title: data.title,
      class_name: data.className,
      subject: data.subject,
      due_date: data.dueDate,
      external_link: data.link || "",
      created_at: new Date().toISOString()
    };
    await setDoc(doc(db, "assignments", id), ass);
    return ass;
  }

  static async deleteAssignment(id) {
    await deleteDoc(doc(db, "assignments", id));
  }

  // ── 11. WARDS FOR PARENTS ─────────────────────────────────────
  static async getWards(parentId) {
    const q = query(collection(db, "students"), where("parent_id", "==", parentId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  // ── 12. MESSAGES ──────────────────────────────────────────────
  static async getMessages(userId) {
    const q = query(collection(db, "messages"), where("recipient_id", "==", userId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }

  static async getSentMessages(userId) {
    const q = query(collection(db, "messages"), where("sender_id", "==", userId));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    list.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }

  static async getRecipients(currentRole, currentUserId) {
    const snap = await getDocs(collection(db, "users"));
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return users.filter(u => u.id !== currentUserId).map(u => ({
      id: u.id,
      name: u.name,
      role: u.role
    }));
  }

  static async sendMessage({ senderId, recipientId, subject, message }) {
    const id = "MSG" + Math.floor(10000 + Math.random() * 90000);
    const sDoc = await getDoc(doc(db, "users", senderId));
    const rDoc = await getDoc(doc(db, "users", recipientId));

    const msg = {
      id,
      sender_id: senderId,
      sender_name: sDoc.exists() ? sDoc.data().name : senderId,
      sender_role: sDoc.exists() ? sDoc.data().role : "user",
      recipient_id: recipientId,
      recipient_name: rDoc.exists() ? rDoc.data().name : recipientId,
      recipient_role: rDoc.exists() ? rDoc.data().role : "user",
      subject,
      message,
      is_read: 0,
      created_at: new Date().toISOString()
    };

    await setDoc(doc(db, "messages", id), msg);
    return msg;
  }

  static async markMessageRead(id) {
    await updateDoc(doc(db, "messages", id), { is_read: 1 });
  }

  // ── 13. PROMOTIONS ────────────────────────────────────────────
  static async getPromotionList(className) {
    const snap = await getDocs(query(collection(db, "students"), where("class_name", "==", className)));
    return snap.docs.map(d => {
      const s = d.data();
      return {
        id: d.id,
        name: s.name,
        class: s.class_name,
        promotion_status: s.promotion_status || "none"
      };
    });
  }

  static async recommendPromotion(studentId) {
    await updateDoc(doc(db, "students", studentId), { promotion_status: "recommended" });
  }

  static async getRecommendedPromotions() {
    const snap = await getDocs(query(collection(db, "students"), where("promotion_status", "==", "recommended")));
    return snap.docs.map(d => {
      const s = d.data();
      return {
        id: d.id,
        name: s.name,
        class: s.class_name,
        promotion_status: "recommended"
      };
    });
  }

  static async approvePromotion(studentId, nextClass) {
    await updateDoc(doc(db, "students", studentId), {
      class_name: nextClass,
      promotion_status: "promoted"
    });
  }

  // ── 14. CLASSES ROSTER HELPER ──────────────────────────────────
  static async getClasses() {
    const snap = await getDocs(collection(db, "students"));
    const classes = new Set();
    snap.forEach(d => {
      const s = d.data();
      if (s.class_name) classes.add(s.class_name);
    });
    return Array.from(classes).sort();
  }

  static async getRoster(className) {
    const snap = await getDocs(query(collection(db, "students"), where("class_name", "==", className)));
    return snap.docs.map(d => ({ id: d.id, name: d.data().name }));
  }
}

// Attach globally for ES script modules
window.FirebaseDB = FirebaseDB;
