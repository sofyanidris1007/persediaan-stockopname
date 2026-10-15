/**
 * app.js - Main Application Coordinator, Router, Toast System, Modals & UI Helpers
 * SMP Negeri 1 Penajam Paser Utara
 */

class AppController {
    constructor() {
        this.currentView = 'dashboard';
        this.toastContainer = null;
        this.activeModal = null;
    }

    init() {
        this.toastContainer = document.getElementById('toast-container');
        this.bindGlobalEvents();
        this.populateYearSelectors();

        if (window.Auth && window.Auth.isAuthenticated()) {
            this.showAuthenticatedUI();
            this.navigateTo(this.currentView);
        } else {
            this.showLoginScreen();
        }
    }

    // SVG Icons Library (Lucide / Feather style)
    getIcon(name, size = 18, className = '') {
        const icons = {
            dashboard: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
            package: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
            arrowDownCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><circle cx="12" cy="12" r="10"/><path d="12 8v8"/><path d="m8 12 4 4 4-4"/></svg>`,
            arrowUpCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="12 16V8"/></svg>`,
            clipboardCheck: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`,
            fileText: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`,
            settings: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
            logOut: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>`,
            plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
            edit: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
            trash: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`,
            printer: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>`,
            download: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>`,
            lock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
            unlock: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>`,
            alertTriangle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
            checkCircle: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
            search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
            eye: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${className}"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`
        };
        return icons[name] || '';
    }

    // Populate Year Dropdowns (2026 - 2045)
    populateYearSelectors() {
        const selects = document.querySelectorAll('.year-selector-dropdown');
        selects.forEach(select => {
            select.innerHTML = '';
            for (let y = 2026; y <= 2045; y++) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.textContent = `TA ${y}`;
                if (window.Auth && window.Auth.currentYear === y) {
                    opt.selected = true;
                }
                select.appendChild(opt);
            }
        });
    }

    bindGlobalEvents() {
        // Navigation clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                if (view) this.navigateTo(view);
            });
        });

        // Year select change in topbar
        const topbarYearSelect = document.getElementById('topbar-year-select');
        if (topbarYearSelect) {
            topbarYearSelect.addEventListener('change', (e) => {
                const selectedYear = Number(e.target.value);
                window.Auth.setYear(selectedYear);
            });
        }

        // Mobile sidebar toggle
        const btnMobile = document.getElementById('btn-mobile-toggle');
        const sidebar = document.querySelector('.app-sidebar');
        if (btnMobile && sidebar) {
            btnMobile.addEventListener('click', () => {
                sidebar.classList.toggle('show');
            });
        }

        // Global Modal Close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.closeActiveModal();
            }
            if (e.target.closest('.modal-close') || e.target.closest('[data-modal-close]')) {
                this.closeActiveModal();
            }
        });

        // Login Form submit
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLoginSubmit();
            });
        }

        // Logout buttons
        document.querySelectorAll('.btn-logout-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm('Apakah Anda yakin ingin keluar dari aplikasi persediaan?')) {
                    window.Auth.logout('manual');
                }
            });
        });
    }

    async handleLoginSubmit() {
        const usernameInput = document.getElementById('login-username');
        const passwordInput = document.getElementById('login-password');
        const yearInput = document.getElementById('login-year');
        const alertBox = document.getElementById('login-alert');
        const submitBtn = document.getElementById('login-btn-submit');

        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const year = yearInput.value;

        alertBox.style.display = 'none';
        alertBox.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'Memverifikasi...';

        try {
            await window.Auth.login(username, password, year);
            this.showToast('success', 'Selamat Datang!', `Berhasil masuk ke Tahun Anggaran ${year}`);
            this.showAuthenticatedUI();
            this.navigateTo('dashboard');
        } catch (err) {
            alertBox.style.display = 'block';
            alertBox.textContent = err.message;
            this.showToast('error', 'Login Gagal', err.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Masuk ke Aplikasi';
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';

        // Check if locked
        const lockStatus = window.Auth.isLockedOut();
        const alertBox = document.getElementById('login-alert');
        if (lockStatus.locked) {
            alertBox.style.display = 'block';
            alertBox.textContent = lockStatus.message;
        } else {
            alertBox.style.display = 'none';
        }
    }

    showAuthenticatedUI() {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('app-container').style.display = 'flex';

        // Update profile in sidebar
        const user = window.Auth.currentUser;
        if (user) {
            const nameEl = document.getElementById('sidebar-user-name');
            const roleEl = document.getElementById('sidebar-user-role');
            if (nameEl) nameEl.textContent = user.nama || user.username;
            if (roleEl) roleEl.textContent = user.role || 'Operator';
        }

        this.updateHeaderYearStatus();
    }

    updateHeaderYearStatus() {
        const currentYear = window.Auth.currentYear;
        const topbarSelect = document.getElementById('topbar-year-select');
        if (topbarSelect) topbarSelect.value = currentYear;

        const isLocked = window.DB.isYearLocked(currentYear);
        const badge = document.getElementById('topbar-year-status-badge');
        if (badge) {
            if (isLocked) {
                badge.className = 'year-status-badge locked';
                badge.innerHTML = `${this.getIcon('lock', 13)} Terkunci (Read-Only)`;
            } else {
                badge.className = 'year-status-badge open';
                badge.innerHTML = `${this.getIcon('unlock', 13)} Periode Aktif`;
            }
        }
    }

    onAuthChanged(isAuthenticated, reason) {
        if (!isAuthenticated) {
            this.showLoginScreen();
            if (reason === 'timeout') {
                this.showToast('warning', 'Sesi Berakhir', 'Sesi Anda telah berakhir setelah 30 menit tidak aktif. Silakan login kembali.');
            }
        }
    }

    onYearChanged(newYear) {
        this.updateHeaderYearStatus();
        this.showToast('info', 'Tahun Kerja Diubah', `Beralih ke Tahun Anggaran ${newYear}`);
        this.refreshCurrentView();
    }

    updateSessionDisplay(msRemaining) {
        const el = document.getElementById('session-timer-text');
        if (!el) return;
        const totalSec = Math.floor(msRemaining / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        el.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // Router
    navigateTo(viewName) {
        this.currentView = viewName;

        // Update sidebar links
        document.querySelectorAll('.nav-item').forEach(el => {
            if (el.getAttribute('data-view') === viewName) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        // Hide all view panels
        document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));

        // Show target view panel
        const target = document.getElementById(`view-${viewName}`);
        if (target) {
            target.classList.add('active');
        }

        // Close mobile sidebar if open
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) sidebar.classList.remove('show');

        // Render module content
        this.refreshCurrentView();
    }

    refreshCurrentView() {
        switch (this.currentView) {
            case 'dashboard':
                if (window.DashboardModule) window.DashboardModule.render();
                break;
            case 'barang':
                if (window.BarangModule) window.BarangModule.render();
                break;
            case 'masuk':
                if (window.MasukModule) window.MasukModule.render();
                break;
            case 'keluar':
                if (window.KeluarModule) window.KeluarModule.render();
                break;
            case 'opname':
                if (window.OpnameModule) window.OpnameModule.render();
                break;
            case 'laporan-persediaan':
                if (window.LaporanModule) window.LaporanModule.renderPersediaan();
                break;
            case 'laporan-rincian':
                if (window.LaporanModule) window.LaporanModule.renderRincian();
                break;
            case 'pengaturan':
                if (window.PengaturanModule) window.PengaturanModule.render();
                break;
        }
    }

    // Modals
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        this.closeActiveModal();
        modal.classList.add('active');
        this.activeModal = modal;
    }

    closeActiveModal() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            this.activeModal = null;
        }
    }

    // Toast Notifications
    showToast(type, title, message) {
        if (!this.toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        let iconName = 'checkCircle';
        if (type === 'error') iconName = 'alertTriangle';
        if (type === 'warning') iconName = 'alertTriangle';
        if (type === 'info') iconName = 'fileText';

        toast.innerHTML = `
            <div class="toast-icon">${this.getIcon(iconName, 20)}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(60px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                if (toast.parentElement) toast.parentElement.removeChild(toast);
            }, 300);
        }, 4000);
    }
}

// Global Singleton
window.App = new AppController();
