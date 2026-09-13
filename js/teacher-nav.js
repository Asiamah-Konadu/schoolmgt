// Unified Teacher Sidebar Component
(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

  window.renderTeacherSidebar = function renderTeacherSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const user = (window.Auth && Auth.getCurrentUser()) || { name: 'Teacher', role: 'teacher' };
    const initials = user.name ? user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'TC';

    const navItems = [
      { href: 'dashboard.html', label: 'Dashboard', icon: '📊' },
      { href: 'timetable.html', label: 'My Timetable', icon: '⏳' },
      { href: 'attendance.html', label: 'Class Attendance', icon: '📅' },
      ...(user.assignedClass ? [{ href: 'morning-attendance.html', label: 'Morning Reg.', icon: '☀️' }] : []),
      { href: 'assignments.html', label: 'Assignments', icon: '📝' },
      { href: 'results.html', label: 'Exam Results', icon: '🎓' },
      ...(user.assignedClass ? [{ href: 'promotion.html', label: 'Promotion', icon: '🚀' }] : []),
      { href: 'messages.html', label: 'Messages', icon: '💬' }
    ];

    sidebar.innerHTML = `
      <div class="brand-badge">
        <div class="brand-icon" style="background: linear-gradient(135deg, #059669, #10b981);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
        </div>
        <div>
          <div class="brand-title">Kings Academy</div>
          <div class="brand-subtitle" style="color: #34d399;">Teacher Portal</div>
        </div>
      </div>

      <nav class="flex-col w-full h-full" style="overflow-y: auto; flex: 1;">
        ${navItems
          .map(
            (item) =>
              `<a href="${item.href}" class="nav-link${item.href === currentPage ? ' active' : ''}">
                <span class="nav-icon">${item.icon}</span>
                <span>${item.label}</span>
              </a>`
          )
          .join('')}
        
        <div style="margin-top: auto; padding-top: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0.5rem; border-top: 1px solid var(--border-color); margin-bottom: 0.75rem;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #059669, #10b981); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: white;">${initials}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.825rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name || 'Teacher'}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">${user.assignedClass ? 'Mentor: ' + user.assignedClass : 'Subject Teacher'}</div>
            </div>
          </div>
          <button onclick="Auth.logout()" class="btn btn-outline w-full" style="font-size: 0.8rem; padding: 0.5rem 1rem;">
            🚪 Logout
          </button>
        </div>
      </nav>
    `;
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.sidebar')) {
      window.renderTeacherSidebar();
    }
  });
})();