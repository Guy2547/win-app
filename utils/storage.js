/**
 * Storage Service - Data707
 * จัดการ localStorage ทั้ง user info และ JWT token
 */
const StorageService = {

    // ── User Data ─────────────────────────────
    getUser: () => ({
        id       : localStorage.getItem('u_id'),
        name     : localStorage.getItem('u_name'),
        dept     : JSON.parse(localStorage.getItem('u_dept') || '[]'),
        ip       : localStorage.getItem('u_ip'),
        loginTime: localStorage.getItem('u_login_time')
    }),

    setUser: (userData) => {
        localStorage.setItem('u_id',   userData.id   || '');
        localStorage.setItem('u_name', userData.name || '');
        localStorage.setItem('u_dept', JSON.stringify(
            Array.isArray(userData.dept) ? userData.dept : (userData.dept ? [userData.dept] : [])
        ));
        if (userData.ip)        localStorage.setItem('u_ip', userData.ip);
        if (userData.loginTime) localStorage.setItem('u_login_time', userData.loginTime);
    },

    // ── JWT Token ─────────────────────────────
    setToken: (token) => localStorage.setItem('jwt_token', token),
    getToken: () => localStorage.getItem('jwt_token'),

    // ── Session Check ─────────────────────────
    // ✅ ต้องมีทั้ง user name และ JWT token ถึงจะถือว่า login อยู่
    isLoggedIn: () => !!localStorage.getItem('u_name') && !!localStorage.getItem('jwt_token'),

    // ── Logout ────────────────────────────────
    clearUser: () => localStorage.clear(),

    getUserDept: () => JSON.parse(localStorage.getItem('u_dept') || '[]'),
    getUserName: () => localStorage.getItem('u_name'),
};