(function () {
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

  const navItems = [
    { href: 'dashboard.html', label: 'Dashboard' },
    { href: 'announcements.html', label: 'Announcements' },
    { href: 'students.html', label: 'Students & Parents' },
    { href: 'teachers.html', label: 'Teachers' },
    { href: 'timetable.html', label: 'Timetable Import' },
    { href: 'results.html', label: 'Results Manager' },
    { href: 'finance.html', label: 'Finance Manager' },
    { href: 'promotion.html', label: 'Promotion Manager' },
    { href: 'messages.html', label: 'Messages' }
  ];

  window.renderManagementSidebar = function renderManagementSidebar() {
    const nav = document.querySelector('.sidebar nav');
    if (!nav) return;

    nav.innerHTML = `
      ${navItems
        .map(
          (item) =>
            `<a href="${item.href}" class="nav-link${item.href === currentPage ? ' active' : ''}">${item.label}</a>`
        )
        .join('')}
      <div style="margin-top: auto;">
        <button onclick="Auth.logout()" class="btn btn-outline w-full mt-8">Logout</button>
      </div>
    `;
  };
})();
