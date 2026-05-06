/**
 * Login Page Module
 * Handles login form and redirects.
 */
const LoginPage = {
    init: () => {
        // เช็คว่าเคยล็อกอินไว้ไหม (เช็คจาก LocalStorage ตรงๆ)
        if (localStorage.getItem('u_id') && localStorage.getItem('u_name')) {
            let rawDept = localStorage.getItem('u_dept') || '';
            let deptArray = rawDept.toLowerCase().split(',');
            
            const isAdminOrHR = deptArray.includes('admin') || deptArray.includes('hr');
            window.location.href = isAdminOrHR ? 'dashboard.html' : 'welcome.html';
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
            // 🌟 กันเหนียว: เผื่อ api.js ส่งค่ามาเป็น JSON ตรงๆ หรือซ้อนใน .data
            const data = res.data || res; 

            // 🌟 เซฟข้อมูลลง LocalStorage ตรงๆ เพื่อตัดปัญหาจาก StorageService
            localStorage.setItem('u_id', data.user.id || userId);
            localStorage.setItem('u_name', data.user.name || 'ผู้ใช้งาน');
            
            let rawDept = data.user.dept || ['user'];
            if (Array.isArray(rawDept)) {
                localStorage.setItem('u_dept', rawDept.join(','));
            } else {
                localStorage.setItem('u_dept', String(rawDept));
            }

            loginBtn.style.backgroundColor = '#22c55e';
            loginBtn.innerText = 'เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...';

            setTimeout(() => {
                try {
                    // 🌟 แปลงแผนกให้เป็น Array แน่นอน 100%
                    let deptArray = [];
                    if (Array.isArray(rawDept)) {
                        deptArray = rawDept.map(d => String(d).toLowerCase());
                    } else {
                        deptArray = String(rawDept).toLowerCase().split(',');
                    }

                    // 🌟 เช็คสิทธิ์เพื่อเด้งไปหน้า Dashboard หรือ Welcome
                    const isAdminOrHR = deptArray.includes('admin') || deptArray.includes('hr');
                    window.location.href = isAdminOrHR ? 'dashboard.html' : 'welcome.html';
                } catch (err) {
                    // 🚨 ถ้าเกิด Error ตอนกำลังเปลี่ยนหน้า ให้แสดงบนปุ่มเลย!
                    loginBtn.innerText = 'Error: ' + err.message;
                    loginBtn.style.backgroundColor = '#ef4444';
                }
            }, 500);

        } catch (error) {
            loginBtn.innerText = 'เข้าสู่ระบบ';
            loginBtn.disabled = false;
            loginBtn.style.backgroundColor = ''; // รีเซ็ตสีปุ่มกลับเป็นสีเดิม

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