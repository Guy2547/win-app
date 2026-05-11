/**
 * Login Page Module - Data707
 * รองรับ: login, forgot password (ยืนยันวันเกิด), reset password
 */

function getRoles(dept) {
    if (!dept) return [];
    const raw = Array.isArray(dept) ? dept : [dept];
    return raw.map(r => String(r).toUpperCase().trim()).filter(Boolean);
}

function getRedirectUrl(dept) {
    const roles = getRoles(dept);
    return roles.includes('ADMIN') || roles.includes('HR') ? 'dashboard.html' : 'welcome.html';
}

const LoginPage = {
    _verifiedUserId: null,   // เก็บ userId ที่ผ่านการยืนยันตัวตนแล้ว

    // ── Switch Views ─────────────────────────
    showLogin: () => {
        document.getElementById('view-login').classList.add('active');
        document.getElementById('view-forgot').classList.remove('active');
        document.getElementById('view-reset').classList.remove('active');
        LoginPage._clearMessages();
    },

    showForgot: () => {
        document.getElementById('view-login').classList.remove('active');
        document.getElementById('view-forgot').classList.add('active');
        document.getElementById('view-reset').classList.remove('active');
        LoginPage._clearMessages();
    },

    showReset: () => {
        document.getElementById('view-login').classList.remove('active');
        document.getElementById('view-forgot').classList.remove('active');
        document.getElementById('view-reset').classList.add('active');
        LoginPage._clearMessages();
    },

    _clearMessages: () => {
        ['login-error','forgot-error','forgot-success','reset-error','reset-success'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.innerText = ''; }
        });
    },

    _showMsg: (id, text) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = text;
        el.style.display = 'block';
    },

    // ── Init ─────────────────────────────────
    init: () => {
        if (StorageService.isLoggedIn()) {
            window.location.href = getRedirectUrl(StorageService.getUserDept());
            return;
        }
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const activeView = document.querySelector('.view.active')?.id;
                if (activeView === 'view-login')  LoginPage.handleLogin();
                if (activeView === 'view-forgot') LoginPage.verifyIdentity();
                if (activeView === 'view-reset')  LoginPage.resetPassword();
            }
        });
    },

    // ── Login ─────────────────────────────────
    handleLogin: async () => {
        const userId   = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        LoginPage._clearMessages();

        if (!userId || !password) {
            LoginPage._showMsg('login-error', '⚠️ กรุณากรอก USER ID และรหัสผ่านให้ครบถ้วน');
            return;
        }

        loginBtn.innerText = 'กำลังตรวจสอบ...';
        loginBtn.disabled  = true;

        try {
            const res  = await ApiService.login(userId, password);
            const data = res.data;

            StorageService.setToken(data.token);
            StorageService.setUser({
                id       : data.user.id   || userId,
                name     : data.user.name || 'ผู้ใช้งาน',
                dept     : data.user.dept || [],
                ip       : data.session?.ip,
                loginTime: data.session?.loginTime
            });

            loginBtn.style.backgroundColor = '#22c55e';
            loginBtn.innerText = 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...';

            setTimeout(() => {
                window.location.href = getRedirectUrl(data.user.dept);
            }, 500);

        } catch (error) {
            loginBtn.innerText = 'เข้าสู่ระบบ';
            loginBtn.disabled  = false;

            if (error.response) {
                const msgs = {
                    404: '❌ ไม่พบ USER ID นี้ในระบบ',
                    401: '❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง',
                    403: '❌ บัญชีของคุณถูกระงับการใช้งาน',
                };
                LoginPage._showMsg('login-error', msgs[error.response.status] || '⚠️ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
            } else {
                LoginPage._showMsg('login-error', '🔌 ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
            }
        }
    },

    // ── Verify Identity (ยืนยันวันเกิด) ──────
    verifyIdentity: async () => {
        const userId    = document.getElementById('forgot-userId').value.trim();
        const birthdate = document.getElementById('forgot-birthdate').value;
        const btn       = document.getElementById('verifyBtn');

        LoginPage._clearMessages();

        if (!userId || !birthdate) {
            LoginPage._showMsg('forgot-error', '⚠️ กรุณากรอก USER ID และวันเกิดให้ครบ');
            return;
        }

        btn.innerText = 'กำลังตรวจสอบ...';
        btn.disabled  = true;

        try {
            const res = await fetch(`${CONFIG.API_URL}/api/users/verify-identity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, birthdate })
            });
            const result = await res.json();

            if (result.status === 'success') {
                LoginPage._verifiedUserId = userId;
                LoginPage._showMsg('forgot-success', '✅ ยืนยันตัวตนสำเร็จ กำลังเปลี่ยนหน้า...');
                setTimeout(() => LoginPage.showReset(), 1000);
            } else {
                LoginPage._showMsg('forgot-error', '❌ ' + result.message);
            }
        } catch (e) {
            LoginPage._showMsg('forgot-error', '🔌 ไม่สามารถเชื่อมต่อ API ได้');
        } finally {
            btn.innerText = 'ยืนยันตัวตน';
            btn.disabled  = false;
        }
    },

    // ── Reset Password ────────────────────────
    resetPassword: async () => {
        const newPass     = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;
        const btn         = document.getElementById('resetBtn');

        LoginPage._clearMessages();

        if (!newPass || !confirmPass) {
            LoginPage._showMsg('reset-error', '⚠️ กรุณากรอกรหัสผ่านให้ครบ');
            return;
        }
        if (newPass.length < 6) {
            LoginPage._showMsg('reset-error', '⚠️ รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
            return;
        }
        if (newPass !== confirmPass) {
            LoginPage._showMsg('reset-error', '❌ รหัสผ่านทั้งสองช่องไม่ตรงกัน');
            return;
        }
        if (!LoginPage._verifiedUserId) {
            LoginPage._showMsg('reset-error', '❌ Session หมดอายุ กรุณายืนยันตัวตนใหม่');
            return;
        }

        btn.innerText = 'กำลังบันทึก...';
        btn.disabled  = true;

        try {
            const res = await fetch(`${CONFIG.API_URL}/api/users/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: LoginPage._verifiedUserId, newPassword: newPass })
            });
            const result = await res.json();

            if (result.status === 'success') {
                LoginPage._showMsg('reset-success', '✅ เปลี่ยนรหัสผ่านสำเร็จ กำลังกลับหน้าเข้าสู่ระบบ...');
                LoginPage._verifiedUserId = null;
                setTimeout(() => LoginPage.showLogin(), 1500);
            } else {
                LoginPage._showMsg('reset-error', '❌ ' + result.message);
            }
        } catch (e) {
            LoginPage._showMsg('reset-error', '🔌 ไม่สามารถเชื่อมต่อ API ได้');
        } finally {
            btn.innerText = '💾 บันทึกรหัสผ่านใหม่';
            btn.disabled  = false;
        }
    }
};

document.addEventListener('DOMContentLoaded', LoginPage.init);