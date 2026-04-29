/**
 * Welcome Page Module
 * Displays regular user info and handles logout.
 */
const WelcomePage = {
    init: () => {
        if (!StorageService.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        const user = StorageService.getUser();
        document.getElementById('displayId').innerText = user.id || '-';
        document.getElementById('displayName').innerText = user.name || '-';
        document.getElementById('displayDept').innerText = (user.dept || '-').toUpperCase();
        document.getElementById('displayTime').innerText = user.loginTime || '-';
    },

    logout: () => {
        StorageService.clearUser();
        window.location.href = 'index.html';
    }
};

document.addEventListener('DOMContentLoaded', WelcomePage.init);
