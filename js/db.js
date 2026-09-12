// Mock Database System using LocalStorage
class DB {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        if (!localStorage.getItem('users')) {
            const initialUsers = [
                // Management (Admin)
                { id: 'ADM001', name: 'System Admin', role: 'management', email: 'admin@school.edu', password: 'password123' },
                // Teachers
                { id: 'TCH001', name: 'Jane Smith', role: 'teacher', email: 'jane.smith@school.edu', password: 'password123', subjects: ['Mathematics', 'Physics'], assignedClass: 'Grade 10A' },
                { id: 'TCH002', name: 'Robert Johnson', role: 'teacher', email: 'robert.j@school.edu', password: 'password123', subjects: ['History', 'English'], assignedClass: 'Grade 10B' },
                // Parents (password: phone number by default)
                { id: 'PAR001', name: 'Michael Brown', role: 'parent', email: 'michael.b@email.com', phone: '555-0101', password: '555-0101', studentIds: ['STU001'] },
                // Students (Mainly referenced, they don't explicitly login in this spec)
                { id: 'STU001', name: 'Tommy Brown', class: 'Grade 10A', parentId: 'PAR001' }
            ];
            localStorage.setItem('users', JSON.stringify(initialUsers));
        }

        if (!localStorage.getItem('announcements')) {
            const announcements = [
                { id: 'A001', title: 'Welcome to the New Term', content: 'Classes begin promptly at 8:00 AM.', target: 'both', date: new Date().toISOString() },
                { id: 'A002', title: 'Staff Meeting', content: 'Mandatory staff meeting this Friday.', target: 'teachers', date: new Date().toISOString() }
            ];
            localStorage.setItem('announcements', JSON.stringify(announcements));
        }

        if (!localStorage.getItem('attendance')) {
            localStorage.setItem('attendance', JSON.stringify([]));
        }

        if (!localStorage.getItem('teacher_attendance')) {
            localStorage.setItem('teacher_attendance', JSON.stringify([]));
        }

        if (!localStorage.getItem('assignments')) {
            localStorage.setItem('assignments', JSON.stringify([]));
        }
        
        if (!localStorage.getItem('timetables')) {
            // Mock timetables linking class, day, subject, teacher
            const timetables = [
                { id: 'TT001', class: 'Grade 10A', day: 'Monday', time: '08:00', subject: 'Mathematics', teacherId: 'TCH001' },
                { id: 'TT002', class: 'Grade 10A', day: 'Monday', time: '09:00', subject: 'History', teacherId: 'TCH002' },
            ];
            localStorage.setItem('timetables', JSON.stringify(timetables));
        }
        
        if (!localStorage.getItem('financials')) {
            const financials = [
                { studentId: 'STU001', description: 'Term 1 Tuition', amount: 1500, paid: 1500, due: 0, date: new Date().toISOString() },
                { studentId: 'STU001', description: 'Extracurricular Fees', amount: 200, paid: 100, due: 100, date: new Date().toISOString() }
            ];
            localStorage.setItem('financials', JSON.stringify(financials));
        }
    }

    get(table) {
        return JSON.parse(localStorage.getItem(table) || '[]');
    }

    set(table, data) {
        localStorage.setItem(table, JSON.stringify(data));
    }

    add(table, item) {
        const data = this.get(table);
        item.id = item.id || Math.random().toString(36).substr(2, 9);
        data.push(item);
        this.set(table, data);
        return item;
    }

    update(table, id, updates) {
        const data = this.get(table);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.set(table, data);
            return data[index];
        }
        return null;
    }
}

const db = new DB();
