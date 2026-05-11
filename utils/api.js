/**
 * API Service - Data707 Frontend
 * ทุก request จะแนบ JWT token ไปใน Header อัตโนมัติ
 */

// ── Helper: ดึง token จาก localStorage ────────
function getAuthHeader() {
    const token = localStorage.getItem('jwt_token');
    // ✅ ส่งใน format: "Bearer xxx.yyy.zzz"
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const ApiService = {

    // ── Login (ไม่ต้องมี token) ───────────────
    login: (userId, password) => {
        return axios.post(`${CONFIG.API_URL}/login`, {
            USER_ID  : userId,
            PASSWORD : password
        });
        // หลัง login สำเร็จ → login.js จะเอา token ไปเก็บใน localStorage
    },

    // ── Get All Users (ต้องมี token) ─────────
    getAllUsers: () => {
        return axios.get(`${CONFIG.API_URL}/api/users/all-users`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()   // ✅ แนบ token ทุกครั้ง
            }
        }).then(res => res.data);
    },

    // ── Get All Logs (ต้องมี token) ──────────
    getAllLogs: () => {
        return axios.get(`${CONFIG.API_URL}/api/logs`, {
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader()
            }
        }).then(res => res.data);
    },

    // ── Update Status (ต้องมี token) ─────────
    updateUserStatus: (userId, status) => {
        return axios.put(`${CONFIG.API_URL}/api/users/update-status/${userId}`,
            { status },
            { headers: { 'Content-Type': 'application/json', ...getAuthHeader() } }
        ).then(res => res.data);
    },

    // ── Helper สำหรับ fetch() ที่ใช้ใน dashboard-new.js ─
    // ใช้แทนที่จะ copy getAuthHeader ทุกที่
    authFetch: (url, options = {}) => {
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
                ...(options.headers || {})
            }
        });
    }
};