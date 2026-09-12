(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

  const navItems = [
    { href: 'dashboard.html', label: 'Dashboard', icon: '📊' },
    { href: 'timetable.html', label: 'Timetable', icon: '⏳' },
    { href: 'attendance.html', label: 'Attendance', icon: '📅' },
    { href: 'morning-attendance.html', label: 'Morning', icon: '☀️' },
    { href: 'assignments.html', label: 'Assignments', icon: '📝' },
    { href: 'results.html', label: 'Results', icon: '🎓' },
    { href: 'messages.html', label: 'Messages', icon: '💬' }
  ];

  window.renderTeacherSidebar = function renderTeacherSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const nav = sidebar?.querySelector('nav');
    if (!sidebar || !nav) return;

    if (localStorage.getItem('sidebarCollapsed') === 'true') {
      document.body.classList.add('collapsed');
    }

    if (!sidebar.querySelector('.sidebar-toggle')) {
      sidebar.insertAdjacentHTML('afterbegin', `
        <button class="sidebar-toggle" onclick="toggleSidebar()" title="Toggle Sidebar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      `);
    }

    nav.innerHTML = `
      ${navItems
        .map(
          (item) =>
            `<a href="${item.href}" class="nav-link${item.href === currentPage ? ' active' : ''}">
                <span class="nav-icon">${item.icon}</span>
                <span class="nav-text">${item.label}</span>
             </a>`
        )
        .join('')}
      <div style="margin-top: auto;">
        <button onclick="Auth.logout()" class="nav-link" style="width: 100%; background: none; border: none; cursor: pointer;">
          <span class="nav-icon">🚪</span>
          <span class="nav-text">Logout</span>
        </button>
      </div>
    `;
  };

  window.toggleSidebar = function() {
    const isCollapsed = document.body.classList.toggle('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  };
})();