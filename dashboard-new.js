/**
 * Dashboard Module
 * Main logic for handling view switching, data loading, and filtering.
 */

// 🌟 Helper Function: จัดรูปแบบวันที่ให้สวยงามตามเครื่องของผู้ใช้
const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; 

        return date.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    } catch (e) {
        return dateString;
    }
};

const Dashboard = {
    state: {
        allLogsData: [],
        allUsersData: [],
        currentFilteredData: [],
        currentView: 'users'
    },

    init: () => {
        if (!StorageService.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        const user = StorageService.getUser();
        Navbar.init(user.name, user.dept);

        const dept = (user.dept || '').toLowerCase();
        const btnUsers = document.getElementById('btn-users');
        const btnLogs = document.getElementById('btn-logs');
        const noAccessMsg = document.getElementById('no-access-msg');

        // 🌟 ตั้งสิทธิ์การมองเห็นเมนู
        if (dept === 'admin' || dept === 'it') {
            btnUsers.style.display = 'block';
            btnLogs.style.display = 'block';
        } else if (dept === 'hr' || dept === 'marketing') {
            btnUsers.style.display = 'block';
        } else {
            noAccessMsg.style.display = 'block';
        }

        // 🌟 [Real-time] เชื่อมต่อ Socket.io (เปลี่ยน URL เป็นของ Railway คุณ)
        // ถ้าใช้ Polling (5 วินาที) ด้านล่างแล้ว จะไม่ใส่ส่วนนี้ก็ได้ครับ
        try {
            const socket = io('https://server-logs-dashboard-production-b865.up.railway.app'); 
            socket.on('new-log', () => {
                if (Dashboard.state.currentView === 'logs') {
                    console.log('⚡ Socket: ดึงข้อมูลใหม่...');
                    Dashboard.loadLogs();
                }
            });
        } catch (e) {
            console.log('Socket connection failed, falling back to polling.');
        }

        // 🌟 [Real-time] Polling: ดึงข้อมูลใหม่ทุกๆ 5 วินาที
        setInterval(() => {
            if (Dashboard.state.currentView === 'logs') {
                Dashboard.loadLogs(); 
                console.log('🔄 Auto-refreshing logs...');
            }
        }, 5000);

        // 🌟 เชื่อมระบบเปลี่ยนหน้าของ Table
        Table.onPageChange = () => {
            if (Dashboard.state.currentView === 'users') {
                Dashboard.renderUsers(Dashboard.state.currentFilteredData);
            } else {
                Dashboard.renderLogs(Dashboard.state.currentFilteredData);
            }
        };
    },

    openView: (type) => {
        Dashboard.state.currentView = type;
        document.getElementById('menu-view').style.display = 'none';
        document.getElementById('data-view').style.display = 'block';
        Table.state.currentPage = 1;

        const title = document.getElementById('data-title');
        const desc = document.getElementById('data-desc');
        const logFilters = document.getElementById('logFilters');
        const userFilters = document.getElementById('userFilters');

        if (type === 'users') {
            title.innerText = '👥 ระบบจัดการ User';
            desc.innerText = 'รายชื่อผู้ใช้งานทั้งหมดในระบบ';
            logFilters.style.display = 'none';
            userFilters.style.display = 'block';
            Dashboard.loadUsers();
        } else {
            title.innerText = '📊 System Logs Activity';
            desc.innerText = 'ประวัติการเข้าใช้งานและเหตุการณ์ในระบบ';
            logFilters.style.display = 'flex';
            userFilters.style.display = 'none';
            Dashboard.loadLogs();
        }
    },

    goBack: () => {
        document.getElementById('data-view').style.display = 'none';
        document.getElementById('menu-view').style.display = 'flex';
    },

    loadUsers: async () => {
        Table.showLoading(5);
        try {
            const res = await ApiService.getAllUsers();
            Dashboard.state.allUsersData = res.data;
            Dashboard.state.currentFilteredData = res.data;
            Dashboard.renderUsers(res.data);
        } catch (err) {
            Table.showError(5);
        }
    },

    filterUsers: () => {
        const searchRole = document.getElementById('searchRole').value.toLowerCase();
        Dashboard.state.currentFilteredData = Dashboard.state.allUsersData.filter(row => {
            const role = (row.DEPARTMENT || row.department || row.ROLE || row.role || '').toLowerCase();
            return searchRole === "" || role === searchRole;
        });
        Table.state.currentPage = 1;
        Dashboard.renderUsers(Dashboard.state.currentFilteredData);
    },

    renderUsers: (data) => {
        Table.setHeaders(['USER_ID', 'USERNAME', 'ROLE', 'STATUS', 'จัดการสิทธิ์']);
        const paginatedData = Table.getPaginatedData(data);
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        if (data.length === 0) {
            Table.showEmpty(5);
            return;
        }

        paginatedData.forEach(row => {
            const tr = document.createElement('tr');
            const userId = row.USER_ID || row.user_id || '-';
            const username = row.USERNAME || row.username || '-';
            const dept = row.DEPARTMENT || row.department || row.ROLE || row.role || '-';
            const rawStatus = row.STATUS || row.status || 'ACTIVE';

            let currentStatus = rawStatus === 'DEACTIVATED' ? 'INACTIVATED' : rawStatus;
            const statusColor = currentStatus === 'ACTIVE' ? '#4ade80' : '#f87171';
            
            tr.innerHTML = `
                <td>${userId}</td>
                <td>${username}</td>
                <td>${dept}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${currentStatus}</td>
                <td>
                    <select onchange="Dashboard.changeStatus('${userId}', this.value)" style="padding: 6px; border-radius: 6px; background: rgba(15,23,42,0.9); color: white; border: 1px solid var(--primary); cursor: pointer;">
                        <option value="ACTIVE" ${currentStatus === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
                        <option value="DEACTIVATED" ${rawStatus === 'DEACTIVATED' ? 'selected' : ''}>DEACTIVATED</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
        Table.setupPagination(data.length); 
    },

    changeStatus: async (userId, newStatus) => {
        const confirm = await Modal.show('ยืนยัน?', `เปลี่ยนสถานะ ${userId} เป็น ${newStatus}?`);
        if (!confirm) { Dashboard.loadUsers(); return; }

        try {
            await ApiService.updateUserStatus(userId, newStatus, StorageService.getUserDept());
            await Modal.success('สำเร็จ', 'อัปเดตเรียบร้อย');
            Dashboard.loadUsers();
        } catch (err) {
            Modal.error('ล้มเหลว', 'คุณไม่มีสิทธิ์ทำรายการนี้ หรือเซิร์ฟเวอร์มีปัญหา');
            Dashboard.loadUsers();
        }
    },

        loadLogs: async () => {
    try {
        // ดึงข้อมูลจาก URL ที่คุณเปิดใน Browser แล้วเจอ Ammarin
        const response = await fetch(`${CONFIG.API_URL}/all-logs`);
        const res = await response.json();
        
        console.log("เช็คข้อมูลดิบ:", res);

        // 🌟 จุดสำคัญ: ต้องแกะเอาเฉพาะชั้น .data มาใช้ (เพราะ Backend ส่ง { status: 'success', data: [...] })
        const logs = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);

        if (logs.length > 0) {
            Dashboard.state.allLogsData = logs;
            Dashboard.state.currentFilteredData = logs;
            Dashboard.renderLogs(logs); // สั่งวาดตาราง
        } else {
            console.log("ไม่พบข้อมูลหรือดึงข้อมูลมาผิดชั้น");
            Table.showEmpty(7);
        }
    } catch (err) {
        console.error("ดึง Logs ล้มเหลว:", err);
    }
},

    filterLogs: () => {
        const searchId = document.getElementById('searchId').value.toLowerCase();
        const searchDate = document.getElementById('searchDate').value;
        const searchStatus = document.getElementById('searchStatus').value;

        Dashboard.state.currentFilteredData = Dashboard.state.allLogsData.filter(row => {
            const userId = (row.USER_ID || row.user_id || '').toString().toLowerCase();
            const username = (row.USERNAME || row.username || '').toLowerCase();
            const status = row.STATUS || row.status || '';
            const logTime = (row.LOG_TIME || row.log_time || row.formatted_time || '');
            
            const matchSearch = userId.includes(searchId) || username.includes(searchId);
            const matchStatus = searchStatus === "" || status === searchStatus;
            
            let matchDate = true;
            if (searchDate !== "") {
                const [y, m, d] = searchDate.split('-');
                matchDate = logTime.includes(`${parseInt(d)}/${parseInt(m)}/${y}`) || logTime.includes(searchDate);
            }
            return matchSearch && matchStatus && matchDate;
        });

        Table.state.currentPage = 1;
        Dashboard.renderLogs(Dashboard.state.currentFilteredData);
    },

    renderLogs: (data) => {
        Table.setHeaders(['#', 'USER_ID', 'USERNAME', 'ACTION', 'IP', 'STATUS', 'TIME']);
        const paginatedData = Table.getPaginatedData(data);
        const tbody = document.getElementById('tableBody');
        
        // เก็บตำแหน่ง Scroll ไว้ก่อนวาดใหม่ (ป้องกันจอกระโดด)
        const scrollPos = window.scrollY;
        tbody.innerHTML = '';

        if (data.length === 0) {
            Table.showEmpty(7);
            return;
        }

        paginatedData.forEach((row, idx) => {
            const tr = document.createElement('tr');
            const rawStatus = row.STATUS || row.status || '';
            const statusColor = (rawStatus === 'SUCCESS' || rawStatus === 'ACTIVE') ? '#4ade80' : '#f87171';
            const realIdx = ((Table.state.currentPage - 1) * Table.state.rowsPerPage) + idx + 1;

            const timeValue = row.LOG_TIME || row.log_time || row.formatted_time || '-';
            const displayTime = formatDate(timeValue);

            tr.innerHTML = `
                <td>${realIdx}</td>
                <td>${row.USER_ID || row.user_id || '-'}</td>
                <td>${row.USERNAME || row.username || '-'}</td>
                <td>${row.ACTION || row.action || '-'}</td>
                <td>${row.CLIENT_IP || row.client_ip || '-'}</td>
                <td style="color: ${statusColor}; font-weight: bold;">${rawStatus}</td>
                <td>${displayTime}</td>
            `;
            tbody.appendChild(tr);
        });
        
        Table.setupPagination(data.length); 
    }
};

document.addEventListener('DOMContentLoaded', Dashboard.init);