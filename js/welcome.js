document.addEventListener('DOMContentLoaded', () => {
    // 1. ดึงข้อมูลจาก LocalStorage (ตามชื่อที่ระบบคุณเซฟไว้)
    const userId = localStorage.getItem('u_id');
    const userName = localStorage.getItem('u_name');
    const userDept = localStorage.getItem('u_dept'); 

    // 2. ถ้าไม่มีข้อมูล ให้เด้งกลับหน้าล็อกอิน
    if (!userId || !userName) {
        window.location.href = 'index.html';
        return;
    }

    // 3. จับคู่ ID ให้ตรงกับไฟล์ HTML
    const elId = document.getElementById('user-id');
    const elName = document.getElementById('user-name');
    const elDept = document.getElementById('user-dept');

    // 4. เอาข้อมูลไปแสดงผล
    if (elId) elId.innerText = userId;
    if (elName) elName.innerText = userName;

    if (elDept) {
        // จัดการแผนก (เผื่อมีหลายอันเช่น "it,hr")
        let deptArray = userDept ? userDept.split(',') : [];
        const displayDept = deptArray.length > 0 ? deptArray.join(', ').toUpperCase() : '-';
        elDept.innerText = displayDept;
    }
});

// ฟังก์ชันออกจากระบบ
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// ฟังก์ชันเล่นเกม
function playGame() {
    window.location.href = 'game.html'; // แก้ชื่อไฟล์เป็นหน้าเกมของคุณได้เลย
}