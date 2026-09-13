// Shared UI & Authentication Logic with Direct Firebase Support

window.UI = {
    toggleSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) {
            const isActive = sidebar.classList.toggle('active');
            if (overlay) {
                overlay.classList.toggle('active', isActive);
                overlay.style.display = isActive ? 'block' : 'none';
            }
        }
    },
    closeSidebar: function() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.style.display = 'none';
            }
        }
    }
};

// Global click listeners for sidebar closing
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('sidebar-overlay')) {
        window.UI.closeSidebar();
    }
    if (e.target.closest('.nav-link') && window.innerWidth <= 1024) {
        window.UI.closeSidebar();
    }
});

// Authentication Class
class Auth {
    static async login(idOrEmail, password, roleType) {
        // Try Firebase direct login first if available
        if (window.FirebaseDB) {
            try {
                const user = await window.FirebaseDB.login(idOrEmail, password, roleType);
                if (user) {
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    return user;
                }
            } catch (fbErr) {
                console.warn("[Auth Firebase] Direct login error:", fbErr.message);
                if (fbErr.message && (fbErr.message.includes("Invalid") || fbErr.message.includes("Role mismatch"))) {
                    showToast(fbErr.message, 'error');
                    return null;
                }
            }
        }

        // Fallback to PHP Backend
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
            return null;
        }
    }

    static getBasePath() {
        const isSubdir = window.location.pathname.includes('/teacher/') || 
                         window.location.pathname.includes('/parent/') || 
                         window.location.pathname.includes('/management/');
        return isSubdir ? '../' : '';
    }

    static logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('parentActiveStudent');
        const base = Auth.getBasePath();
        window.location.href = base + 'index.html';
    }

    static getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    static requireAuth(allowedRoles = []) {
        const user = this.getCurrentUser();
        const base = Auth.getBasePath();

        if (!user) {
            window.location.href = base + 'index.html';
            return;
        }
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            // Redirect to their respective dashboards
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
    
    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `<span style="font-weight:700;">${icon}</span> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

window.Auth = Auth;
