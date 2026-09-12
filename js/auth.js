// Shared UI Logic for Mobile Navigation - Defined globally at the top to avoid ReferenceErrors
window.UI = {
    toggleSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) {
            sidebar.classList.toggle('active');
            if (overlay) {
                overlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
            }
        }
    }
};

// Ensure clicking overlay closes sidebar
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
        window.UI.toggleSidebar();
    }
});

// Close sidebar on mobile when nav link is clicked
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('nav-link') && window.innerWidth <= 1024) {
        window.UI.toggleSidebar();
    }
});

// Authentication Logic mapped to PHP Backend
class Auth {
    static async login(idOrEmail, password, roleType) {
        try {
            const data = await ApiClient.request('auth.php', {
                action: 'login',
                userId: idOrEmail,
                password: password,
                role: roleType
            });

            if (data.status === 'success' && data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return data.user;
            }
            return null;
        } catch (error) {
            return null; // Handled by ApiClient toast
        }
    }

    static logout() {
        localStorage.removeItem('currentUser');
        window.location.href = '/index.html';
    }

    static getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    static requireAuth(allowedRoles = []) {
        const user = this.getCurrentUser();
        
        // Calculate base path for redirects to support subdirectories
        const isSubdir = window.location.pathname.includes('/teacher/') || 
                         window.location.pathname.includes('/parent/') || 
                         window.location.pathname.includes('/management/');
        const base = isSubdir ? '../' : '';

        if (!user) {
            window.location.href = base + 'index.html';
            return;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Redirect to their respective dashboards if they access unauthorized page
            if (user.role === 'management') window.location.href = base + 'management/dashboard.html';
            else if (user.role === 'teacher') window.location.href = base + 'teacher/dashboard.html';
            else if (user.role === 'parent') window.location.href = base + 'parent/dashboard.html';
            else window.location.href = base + 'index.html';
        }
    }
}

// Utility: Show Toasts
window.showToast = function(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
