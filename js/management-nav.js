// Unified Management Sidebar Component
(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

  const navItems = [
    { href: 'dashboard.html', label: 'Dashboard', icon: '📊' },
    { href: 'announcements.html', label: 'Announcements', icon: '📢' },
    { href: 'students.html', label: 'Students & Parents', icon: '👨‍👩‍👧‍👦' },
    { href: 'teachers.html', label: 'Teachers', icon: '👨‍🏫' },
    { href: 'timetable.html', label: 'Timetable Import', icon: '⏳' },
    { href: 'results.html', label: 'Results Manager', icon: '🎓' },
    { href: 'finance.html', label: 'Finance Manager', icon: '💰' },
    { href: 'promotion.html', label: 'Promotions', icon: '🚀' },
    { href: 'messages.html', label: 'Messages', icon: '💬' }
  ];

  window.renderManagementSidebar = function renderManagementSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const user = (window.Auth && Auth.getCurrentUser()) || { name: 'Admin', role: 'management' };
    const initials = user.name ? user.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : 'AD';

    sidebar.innerHTML = `
      <div class="brand-badge">
        <div class="brand-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div>
          <div class="brand-title">Kings Academy</div>
          <div class="brand-subtitle">Management</div>
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
            <div style="width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #4f46e5, #8b5cf6); display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; color: white;">${initials}</div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.825rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${user.name || 'Administrator'}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Admin Portal</div>
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
      window.renderManagementSidebar();
    }
  });
})();
