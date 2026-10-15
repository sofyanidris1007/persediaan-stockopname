/**
 * auth.js - Authentication, Lockout Protection & Session Management
 * SMP Negeri 1 Penajam Paser Utara
 */

class AuthService {
    constructor() {
        this.sessionKey = 'smpn1ppu_auth_session';
        this.lockoutKey = 'smpn1ppu_auth_lockout';
        this.sessionDuration = 30 * 60 * 1000; // 30 minutes in ms
        this.lockoutDuration = 5 * 60 * 1000;  // 5 minutes in ms
        this.maxFailedAttempts = 5;

        this.currentUser = null;
        this.currentYear = 2026;
        this.lastActivity = Date.now();
        this.timerInterval = null;

        this.init();
    }

    init() {
        this.restoreSession();
        this.setupActivityListeners();
    }

    /**
     * Compute SHA-256 hash using native Web Crypto API
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    getLockoutInfo() {
        const raw = localStorage.getItem(this.lockoutKey);
        if (!raw) return { failedAttempts: 0, lockedUntil: null };
        try {
            return JSON.parse(raw);
        } catch (e) {
            return { failedAttempts: 0, lockedUntil: null };
        }
    }

    setLockoutInfo(info) {
        localStorage.setItem(this.lockoutKey, JSON.stringify(info));
    }

    recordFailedAttempt() {
        const info = this.getLockoutInfo();
        info.failedAttempts = (info.failedAttempts || 0) + 1;
        if (info.failedAttempts >= this.maxFailedAttempts) {
            info.lockedUntil = Date.now() + this.lockoutDuration;
        }
        this.setLockoutInfo(info);
        return info;
    }

    clearLockout() {
        localStorage.removeItem(this.lockoutKey);
    }

    isLockedOut() {
        const info = this.getLockoutInfo();
        if (info.lockedUntil && info.lockedUntil > Date.now()) {
            const remainingSeconds = Math.ceil((info.lockedUntil - Date.now()) / 1000);
            return {
                locked: true,
                remainingSeconds,
                message: `Akun terkunci sementara karena 5 kali percobaan gagal. Silakan coba lagi dalam ${Math.ceil(remainingSeconds / 60)} menit (${remainingSeconds} detik).`
            };
        }
        if (info.lockedUntil && info.lockedUntil <= Date.now()) {
            this.clearLockout();
        }
        return { locked: false };
    }

    async login(username, password, year) {
        // 1. Check lockout
        const lockStatus = this.isLockedOut();
        if (lockStatus.locked) {
            throw new Error(lockStatus.message);
        }

        const user = window.DB.getUser();
        const inputHash = await this.hashPassword(password);

        // General error message requirement: tidak menyebutkan mana yang salah
        const GENERIC_ERROR = 'Username atau kata sandi tidak valid. Silakan periksa kembali kredensial Anda.';

        if (!user || user.username !== username.trim() || user.passwordHash !== inputHash) {
            const info = this.recordFailedAttempt();
            const attemptsLeft = this.maxFailedAttempts - info.failedAttempts;
            if (attemptsLeft <= 0) {
                window.DB.logActivity('LOGIN_GAGAL_TERKUNCI', 'Autentikasi', `Percobaan login gagal 5x untuk username "${username}". Sistem dikunci 5 menit.`, username);
                throw new Error(`Batas percobaan login terlampaui. Akun Anda dikunci sementara selama 5 menit demi keamanan.`);
            } else {
                window.DB.logActivity('LOGIN_GAGAL', 'Autentikasi', `Percobaan login gagal untuk username "${username}" (${attemptsLeft} kesempatan tersisa)`, username);
                throw new Error(`${GENERIC_ERROR} (Sisa percobaan: ${attemptsLeft})`);
            }
        }

        // Login success
        this.clearLockout();
        this.currentUser = {
            username: user.username,
            nama: user.nama,
            role: user.role
        };
        this.currentYear = Number(year) || 2026;
        this.lastActivity = Date.now();

        this.saveSession();
        window.DB.logActivity('LOGIN_BERHASIL', 'Autentikasi', `Login berhasil ke Tahun Anggaran ${this.currentYear}`, this.currentUser.username);

        this.startSessionTimer();
        return this.currentUser;
    }

    logout(reason = 'manual') {
        const user = this.currentUser ? this.currentUser.username : 'smpn1PPU';
        if (reason === 'timeout') {
            window.DB.logActivity('SESSION_TIMEOUT', 'Autentikasi', 'Sesi berakhir otomatis karena 30 menit tidak aktif', user);
        } else {
            window.DB.logActivity('LOGOUT', 'Autentikasi', 'Pengguna keluar dari aplikasi', user);
        }

        this.currentUser = null;
        localStorage.removeItem(this.sessionKey);
        if (this.timerInterval) clearInterval(this.timerInterval);

        if (window.App) {
            window.App.onAuthChanged(false, reason);
        }
    }

    setYear(newYear) {
        this.currentYear = Number(newYear);
        this.saveSession();
        window.DB.logActivity('GANTI_TAHUN', 'Navigasi', `Beralih ke Tahun Anggaran ${this.currentYear}`, this.currentUser ? this.currentUser.username : 'smpn1PPU');
        if (window.App) {
            window.App.onYearChanged(this.currentYear);
        }
    }

    saveSession() {
        const session = {
            currentUser: this.currentUser,
            currentYear: this.currentYear,
            lastActivity: this.lastActivity
        };
        localStorage.setItem(this.sessionKey, JSON.stringify(session));
    }

    restoreSession() {
        const raw = localStorage.getItem(this.sessionKey);
        if (!raw) return;

        try {
            const session = JSON.parse(raw);
            const now = Date.now();
            if (session.lastActivity && (now - session.lastActivity > this.sessionDuration)) {
                // Session expired
                this.logout('timeout');
                return;
            }
            this.currentUser = session.currentUser;
            this.currentYear = session.currentYear || 2026;
            this.lastActivity = now;
            this.saveSession();
            this.startSessionTimer();
        } catch (e) {
            this.currentUser = null;
            localStorage.removeItem(this.sessionKey);
        }
    }

    isAuthenticated() {
        if (!this.currentUser) return false;
        const now = Date.now();
        if (now - this.lastActivity > this.sessionDuration) {
            this.logout('timeout');
            return false;
        }
        return true;
    }

    touchActivity() {
        if (!this.currentUser) return;
        this.lastActivity = Date.now();
        this.saveSession();
    }

    setupActivityListeners() {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(evt => {
            window.addEventListener(evt, () => {
                this.touchActivity();
            }, { passive: true });
        });
    }

    startSessionTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.currentUser) return;
            const elapsed = Date.now() - this.lastActivity;
            const remaining = Math.max(0, this.sessionDuration - elapsed);

            if (remaining <= 0) {
                this.logout('timeout');
                return;
            }

            if (window.App && window.App.updateSessionDisplay) {
                window.App.updateSessionDisplay(remaining);
            }
        }, 1000);
    }
}

// Global Singleton
window.Auth = new AuthService();
