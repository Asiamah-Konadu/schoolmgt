// Centralized API Client with Direct Firebase Firestore + PHP Fallback Support

const API_BASE = window.location.pathname.includes('/teacher/') || 
                 window.location.pathname.includes('/parent/') || 
                 window.location.pathname.includes('/management/') ? '../api' : 'api';

class ApiClient {
    static getBasePath() {
        const isSubdir = window.location.pathname.includes('/teacher/') ||
                         window.location.pathname.includes('/parent/') ||
                         window.location.pathname.includes('/management/');
        return isSubdir ? '../' : '';
    }

    static async ensureFirebaseBridge() {
        if (window.FirebaseDB) {
            return window.FirebaseDB;
        }

        try {
            const module = await import(ApiClient.getBasePath() + 'js/firebase-db.js');
            window.FirebaseDB = module.FirebaseDB;
            console.log('[Firebase DB] Direct Firestore database connection activated lazily.');
            return window.FirebaseDB;
        } catch (err) {
            console.log('[Database] Running with standard REST API mode.');
            return undefined;
        }
    }

    static async request(endpoint, payload) {
        const action = payload ? payload.action : null;

        // Parent phone push and token registration must stay on the real PHP parent notifications API.
        if (action === 'send_push_phone_notification' || action === 'save_parent_fcm_token') {
            try {
                const response = await fetch(`${API_BASE}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                let data;
                try {
                    data = await response.json();
                } catch (e) {
                    throw new Error(`Server returned invalid JSON (Status: ${response.status})`);
                }

                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }

                if (data.status === 'error') {
                    throw new Error(data.message || 'API Error');
                }

                return data;
            } catch (error) {
                console.error('API Request failed:', error);
                showToast(error.message, 'error');
                throw error;
            }
        }

        // Import-or-use the Firestore bridge lazily, then route the action through it.
        const fb = await ApiClient.ensureFirebaseBridge();
        if (fb && action) {
            try {
                const fbResult = await ApiClient.executeFirebaseAction(action, payload);
                if (fbResult !== undefined) {
                    return { status: 'success', ...fbResult };
                }
                throw new Error(`FirebaseDB has no implementation for action '${action}'.`);
            } catch (fbError) {
                console.warn(`[Firebase Firestore] Action '${action}' note:`, fbError.message);
                if (fbError.message && (fbError.message.includes("Invalid") || fbError.message.includes("mismatch"))) {
                    showToast(fbError.message, 'error');
                }
                throw fbError;
            }
        }

        // Standard PHP REST Backend only used when Firestore bridge is not present.
        try {
            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error(`Server returned invalid JSON (Status: ${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            if (data.status === 'error') {
                throw new Error(data.message || 'API Error');
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            showToast(error.message, 'error');
            throw error;
        }
    }

    // Direct Firestore action dispatcher
    static async executeFirebaseAction(action, data) {
        const fb = window.FirebaseDB;
        if (!fb) return undefined;

        switch (action) {
            // Management / General Stats & Announcements
            case 'get_stats':
                return await fb.getStats();
            case 'get_announcements':
                return { data: await fb.getAnnouncements() };
            case 'create_announcement':
                return await fb.createAnnouncement(data.title, data.content, data.target);
            case 'delete_announcement':
                await fb.deleteAnnouncement(data.id);
                return {};

            // Students & Parents
            case 'get_students':
                return { data: await fb.getStudents() };
            case 'create_student_parent':
                return await fb.createStudentParent(data);
            case 'delete_student':
                await fb.deleteStudent(data.id);
                return {};

            // Teachers
            case 'get_teachers':
                return { data: await fb.getTeachers() };
            case 'create_teacher':
                return await fb.createTeacher(data);
            case 'delete_teacher':
                await fb.deleteTeacher(data.id);
                return {};

            // Timetables
            case 'get_all_timetables':
                return { data: await fb.getAllTimetables() };
            case 'get_timetable':
                if (data.teacherId) return { data: await fb.getTimetableForTeacher(data.teacherId) };
                if (data.className) return { data: await fb.getTimetableForClass(data.className) };
                return { data: await fb.getAllTimetables() };
            case 'import_timetable':
                return await fb.importTimetable(data.rows || []);
            case 'delete_timetable':
                await fb.deleteTimetable(data.id);
                return {};

            // Financials
            case 'get_financials':
                return { data: await fb.getFinancials(data.studentId) };
            case 'get_all_financials':
                return { data: await fb.getAllFinancials() };
            case 'add_financial':
                return await fb.addFinancial(data);
            case 'delete_financial':
                await fb.deleteFinancial(data.id);
                return {};

            // Results
            case 'submit_results':
                return await fb.submitResults(data);
            case 'get_class_results':
                return { data: await fb.getClassResults(data.className, data.subject, data.term, data.academic_year) };
            case 'get_student_results':
                return { data: await fb.getStudentResults(data.studentId, data.term, data.academic_year) };
            case 'get_all_results':
                return { data: await fb.getAllResults(data.term, data.academic_year) };
            case 'get_result_periods':
                return { data: await fb.getResultPeriods() };

            // Attendance & Rosters
            case 'get_classes':
                return { data: await fb.getClasses() };
            case 'get_roster':
                return { data: await fb.getRoster(data.className) };
            case 'get_morning_roster':
                return { data: await fb.getMorningRoster(data.className) };
            case 'submit_lesson_attendance':
                await fb.submitLessonAttendance(data);
                return {};
            case 'submit_morning_attendance':
                return await fb.submitMorningAttendance(data);
            case 'get_student_attendance':
                return { data: await fb.getStudentAttendance(data.studentId) };
            case 'get_teacher_attendance':
                return { data: await fb.getTeacherAttendance(data.className) };

            // Assignments
            case 'get_my_assignments':
                return { data: await fb.getMyAssignments(data.teacherId) };
            case 'get_assignments':
                return { data: await fb.getAssignments(data.className) };
            case 'create_assignment':
                return await fb.createAssignment(data);
            case 'delete_assignment':
                await fb.deleteAssignment(data.id);
                return {};

            // Wards for parent
            case 'get_wards':
                return { data: await fb.getWards(data.parentId) };

            // Messages
            case 'get_messages':
                return { data: await fb.getMessages(data.userId || data.teacherId) };
            case 'get_sent_messages':
                return { data: await fb.getSentMessages(data.userId || data.teacherId) };
            case 'get_recipients':
                return { data: await fb.getRecipients(data.role, data.userId || data.teacherId) };
            case 'send_message':
                return await fb.sendMessage(data);
            case 'mark_message_read':
                await fb.markMessageRead(data.messageId || data.id);
                return {};

            // Promotions
            case 'get_promotion_list':
                return { data: await fb.getPromotionList(data.className) };
            case 'recommend_promotion':
                await fb.recommendPromotion(data.studentId);
                return {};
            case 'get_recommended_promotions':
                return { data: await fb.getRecommendedPromotions() };
            case 'approve_promotion':
                await fb.approvePromotion(data.studentId, data.nextClass || "Promoted");
                return {};

            // Notifications
            case 'get_notifications':
                return { data: await fb.getNotifications(data.userId) };
            case 'mark_read':
                await fb.markNotificationRead(data.id, data.userId);
                return {};
            case 'mark_all_read':
                await fb.markAllNotificationsRead(data.userId);
                return {};

            default:
                return undefined;
        }
    }
}

// Automatically import FirebaseDB if running in modern browser module support
(async function initFirebaseBridge() {
    try {
        const isSubdir = window.location.pathname.includes('/teacher/') || 
                         window.location.pathname.includes('/parent/') || 
                         window.location.pathname.includes('/management/');
        const base = isSubdir ? '../' : '';
        const module = await import(base + 'js/firebase-db.js');
        window.FirebaseDB = module.FirebaseDB;
        console.log("⚡ [Firebase DB] Direct Firestore database connection active.");
    } catch(err) {
        console.log("ℹ️ [Database] Running with standard REST API mode.");
    }
})();

window.ApiClient = ApiClient;
