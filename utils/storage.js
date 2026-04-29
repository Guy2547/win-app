/**
 * Storage Service
 * Encapsulates localStorage access for user session data.
 */
const StorageService = {
    getUser: () => ({
        id: localStorage.getItem('u_id'),
        name: localStorage.getItem('u_name'),
        dept: localStorage.getItem('u_dept'),
        ip: localStorage.getItem('u_ip'),
        loginTime: localStorage.getItem('u_login_time')
    }),

    setUser: (userData) => {
        localStorage.setItem('u_id', userData.id || '');
        localStorage.setItem('u_name', userData.name || '');
        localStorage.setItem('u_dept', userData.dept || '');
        if (userData.ip) localStorage.setItem('u_ip', userData.ip);
        if (userData.loginTime) localStorage.setItem('u_login_time', userData.loginTime);
    },

    isLoggedIn: () => !!localStorage.getItem('u_name'),

    clearUser: () => localStorage.clear(),

    getUserDept: () => localStorage.getItem('u_dept'),

    getUserName: () => localStorage.getItem('u_name')
};
