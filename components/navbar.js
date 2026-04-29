/**
 * Navbar Component
 * Handles navbar display and logout flow.
 */
const Navbar = {
    init: (userName, userDept) => {
        document.getElementById('display-name').innerText = userName || 'ผู้ใช้งาน';
        document.getElementById('display-role').innerText = (userDept || 'ROLE').toUpperCase();
    },

    logout: () => {
        StorageService.clearUser();
        window.location.href = 'index.html';
    }
};
