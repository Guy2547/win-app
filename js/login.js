/**
 * Login Page Module
 * Handles login form and redirects.
 */
const LoginPage = {
    init: () => {
        if (StorageService.isLoggedIn()) {
            const dept = StorageService.getUserDept()?.toLowerCase();
            window.location.href = dept === 'admin' || dept === 'hr' ? 'dashboard.html' : 'welcome.html';
            return;
        }

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                LoginPage.handleLogin();
            }
        });
    },

    showError: (message) => {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.innerText = message;
        errorDiv.style.display = 'block';
        errorDiv.style.animation = 'none';
        setTimeout(() => {
            errorDiv.style.animation = 'shake 0.4s ease-in-out';
        }, 10);
    },

    hideError: () => {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.style.display = 'none';
    },

    handleLogin: async () => {
        const userId = document.getElementById('userId').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        LoginPage.hideError();

        if (!userId || !password) {
            LoginPage.showError('⚠️ กรุณากรอก USER ID และรหัสผ่านให้ครบถ้วน');
            return;
        }

        loginBtn.innerText = 'กำลังตรวจสอบ...';
        loginBtn.disabled = true;

        try {
            const res = await ApiService.login(userId, password);
            const data = res.data;

            StorageService.setUser({
                id: data.user.id || userId,
                name: data.user.name || 'ผู้ใช้งาน',
                dept: data.user.dept || 'user',
                ip: data.session?.ip,
                loginTime: data.session?.loginTime
            });

            loginBtn.style.backgroundColor = '#22c55e';
            loginBtn.innerText = 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...';

            setTimeout(() => {
                const dept = (data.user.dept || 'user').toLowerCase();
                window.location.href = dept === 'admin' || dept === 'hr' ? 'dashboard.html' : 'welcome.html';
            }, 500);
        } catch (error) {
            loginBtn.innerText = 'เข้าสู่ระบบ';
            loginBtn.disabled = false;

            if (error.response) {
                switch (error.response.status) {
                    case 404:
                        LoginPage.showError('❌ ไม่พบ USER ID นี้ในระบบ');
                        break;
                    case 401:
                        LoginPage.showError('❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
                        break;
                    case 403:
                        LoginPage.showError('❌ บัญชีของคุณถูกระงับการใช้งาน');
                        break;
                    default:
                        LoginPage.showError('⚠️ เกิดข้อผิดพลาดจากเซิร์ฟเวอร์');
                }
            } else {
                LoginPage.showError('🔌 ไม่สามารถเชื่อมต่อฐานข้อมูลได้ หรือเซิร์ฟเวอร์ปิดอยู่');
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', LoginPage.init);
