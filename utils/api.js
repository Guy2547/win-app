/**
 * API Service
 * Centralizes backend calls using Axios.
 */
const ApiService = {
    login: async (userId, password) => {
        return axios.post(`${CONFIG.API_URL}/login`, {
            USER_ID: userId,
            PASSWORD: password
        });
    },

    getAllUsers: async () => {
        return axios.get(`${CONFIG.API_URL}/all-users`);
    },

    updateUserStatus: async (userId, status, dept) => {
        return axios.put(`${CONFIG.API_URL}/update-status/${userId}`, {
            status,
            dept
        });
    },

    getAllLogs: async () => {
        return axios.get(`${CONFIG.API_URL}/all-logs`);
    }
};
