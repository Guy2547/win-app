/**
 * Dashboard Module - Data707 System
 */

const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    try {
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('th-TH', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    } catch (e) { return dateString; }
};

const Dashboard = {
    state: {
        allLogsData: [],
        allUsersData: [],
        currentFilteredData: [],
        currentView: 'users'
    },

    _parseRoles: (dept) => {
        if (!dept) return [];
        const raw = Array.isArray(dept) ? dept : String(dept).split(',');
        return raw.map(r => String(r).toUpperCase().trim()).filter(Boolean);
    },

    // ── Init ─────────────────────────────────
    init: () => {
        if (!StorageService.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }
        const user      = StorageService.getUser();
        const userRoles = Dashboard._parseRoles(user?.dept);

        Navbar.init(user.name, userRoles.join(', ') || 'USER');

        const btnUsers = document.getElementById('btn-users');
        const btnLogs  = document.getElementById('btn-logs');
        if (btnUsers) btnUsers.style.display =
            (userRoles.includes('ADMIN') || userRoles.includes('HR')) ? 'block' : 'none';
        if (btnLogs) btnLogs.style.display =
            (userRoles.includes('ADMIN') || userRoles.includes('IT')) ? 'block' : 'none';

        Table.onPageChange = () => {
            const data = Dashboard.state.currentFilteredData;
            Dashboard.state.currentView === 'users'
                ? Dashboard.renderUsers(data)
                : Dashboard.renderLogs(data);
        };
    },

    // ── Open View ────────────────────────────
    openView: (type) => {
        Dashboard.state.currentView = type;
        document.getElementById('menu-view').style.display = 'none';
        document.getElementById('data-view').style.display = 'block';
        Table.state.currentPage = 1;

        const user      = StorageService.getUser();
        const userRoles = Dashboard._parseRoles(user?.dept);

        const btnAddUser  = document.getElementById('btnAddUser');
        const userFilters = document.getElementById('userFilters');
        const logFilters  = document.getElementById('logFilters');

        if (type === 'users') {
            document.getElementById('data-title').innerText = '👥 ระบบจัดการ User';
            if (logFilters)  logFilters.style.display  = 'none';
            if (userFilters) userFilters.style.display = 'block';
            if (btnAddUser)  btnAddUser.style.display  = userRoles.includes('ADMIN') ? 'flex' : 'none';
            Dashboard.loadUsers();
        } else {
            document.getElementById('data-title').innerText = '📊 System Logs';
            if (logFilters)  logFilters.style.display  = 'flex';
            if (userFilters) userFilters.style.display = 'none';
            if (btnAddUser)  btnAddUser.style.display  = 'none';
            Dashboard.loadLogs();
        }
    },

    goBack: () => {
        document.getElementById('data-view').style.display = 'none';
        document.getElementById('menu-view').style.display = 'flex';
    },

    // ══════════════════════════════════════════
    // USERS
    // ══════════════════════════════════════════
    loadUsers: async () => {
        Table.showLoading(6);
        try {
            const res = await ApiService.getAllUsers();
            Dashboard.state.allUsersData       = Array.isArray(res) ? res : (res.data || []);
            Dashboard.state.currentFilteredData = Dashboard.state.allUsersData;
            Dashboard.renderUsers(Dashboard.state.currentFilteredData);
        } catch (err) {
            console.error('[loadUsers]', err);
            const tbody = document.getElementById('tableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#f87171;padding:20px;">❌ ไม่สามารถเชื่อมต่อ API ได้ — ${err.message}</td></tr>`;
        }
    },

    filterUsers: () => {
        const searchRole = (document.getElementById('searchRole')?.value || '').toLowerCase().trim();
        Dashboard.state.currentFilteredData = Dashboard.state.allUsersData.filter(row => {
            const roles = (row.DEPARTMENT || row.department || []).map(r => String(r).toLowerCase());
            return searchRole === '' || roles.includes(searchRole);
        });
        Table.state.currentPage = 1;
        Dashboard.renderUsers(Dashboard.state.currentFilteredData);
    },

    renderUsers: (data) => {
        Table.setHeaders(['USER_ID', 'ชื่อ', 'นามสกุล', 'ROLE', 'STATUS', 'จัดการสถานะ']);
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        if (!data || data.length === 0) { Table.showEmpty(6); return; }

        Table.getPaginatedData(data).forEach(row => {
            const tr        = document.createElement('tr');
            const uId       = row.USER_ID    || row.user_id    || '-';
            const uFirst    = row.FIRST_NAME || row.first_name || '-';
            const uLast     = row.LAST_NAME  || row.last_name  || '-';
            const uStatus   = (row.STATUS    || row.status     || 'ACTIVE').toUpperCase();
            const uRoles    = row.DEPARTMENT || row.department || [];

            const rolesHtml = uRoles.filter(Boolean).map(r =>
                `<span style="background:rgba(56,189,248,0.1);color:#38bdf8;padding:4px 8px;
                 border-radius:4px;margin-right:5px;font-size:0.8rem;font-weight:bold;">
                 ${String(r).toUpperCase()}</span>`
            ).join('');

            tr.innerHTML = `
                <td>${uId}</td>
                <td>${uFirst}</td>
                <td>${uLast}</td>
                <td>${rolesHtml || '-'}</td>
                <td style="color:${uStatus === 'ACTIVE' ? '#4ade80' : '#f87171'};font-weight:bold;">${uStatus}</td>
                <td>
                    <select onchange="Dashboard.changeStatus('${uId}', this.value)"
                        style="padding:6px;border-radius:6px;background:#0f172a;color:white;border:1px solid #38bdf8;">
                        <option value="ACTIVE"      ${uStatus === 'ACTIVE'      ? 'selected' : ''}>ACTIVE</option>
                        <option value="DEACTIVATED" ${uStatus === 'DEACTIVATED' ? 'selected' : ''}>DEACTIVATED</option>
                    </select>
                </td>
            `;
            tbody.appendChild(tr);
        });
        Table.setupPagination(data.length);
    },

    // ── Change Status ─────────────────────────
    changeStatus: async (userId, newStatus) => {
        try {
            const res = await fetch(`${CONFIG.API_URL}/api/users/update-status/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const result = await res.json();
            if (result.status !== 'success') {
                Modal.error('เปลี่ยนสถานะล้มเหลว', result.message);
                Dashboard.loadUsers();
            }
        } catch (e) {
            console.error('[changeStatus]', e);
            Modal.error('API Error', e.message);
            Dashboard.loadUsers();
        }
    },

    // ── Add User Modal ────────────────────────
    showAddUserModal: async () => {
        // โหลด roles จาก DB ทุกครั้งที่เปิด modal
        try {
            const res   = await fetch(`${CONFIG.API_URL}/api/users/roles`);
            const roles = await res.json();
            const select = document.getElementById('new_user_role');
            select.innerHTML = '';
            roles.forEach(r => {
                const opt = document.createElement('option');
                opt.value     = r.role_id;
                opt.innerText = r.role_name.toUpperCase();
                select.appendChild(opt);
            });
        } catch (e) {
            console.error('[loadRoles]', e);
        }
        document.getElementById('add-user-modal')?.classList.add('show');
    },

    closeAddUserModal: () => {
        document.getElementById('add-user-modal')?.classList.remove('show');
        ['new_user_id', 'new_first_name', 'new_last_name', 'new_password'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    },

    submitUser: async () => {
        const userId    = document.getElementById('new_user_id')?.value?.trim();
        const firstName = document.getElementById('new_first_name')?.value?.trim();
        const lastName  = document.getElementById('new_last_name')?.value?.trim();
        const password  = document.getElementById('new_password')?.value;
        const roleId    = document.getElementById('new_user_role')?.value;

        if (!userId || !firstName || !lastName || !password || !roleId) {
            Modal.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
            return;
        }

        try {
            const res = await fetch(`${CONFIG.API_URL}/api/users/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, firstName, lastName, password, roleId })
            });
            const result = await res.json();
            if (result.status === 'success') {
                await Modal.success('เพิ่มพนักงานสำเร็จ');
                Dashboard.closeAddUserModal();
                Dashboard.loadUsers();
            } else {
                Modal.error('ล้มเหลว', result.message);
            }
        } catch (e) {
            console.error('[submitUser]', e);
            Modal.error('API Error', e.message);
        }
    },

    // ══════════════════════════════════════════
    // LOGS
    // ══════════════════════════════════════════
    loadLogs: async () => {
        Table.showLoading(7);
        try {
            const search = document.getElementById('searchLog')?.value?.trim()  || '';
            const date   = document.getElementById('filterDate')?.value          || '';
            const status = document.getElementById('filterStatus')?.value        || '';

            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (date)   params.append('date', date);
            if (status) params.append('status', status);

            const url = `${CONFIG.API_URL}/api/logs/logs${params.toString() ? '?' + params : ''}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            Dashboard.state.allLogsData         = Array.isArray(data) ? data : (data.data || []);
            Dashboard.state.currentFilteredData  = Dashboard.state.allLogsData;
            Dashboard.renderLogs(Dashboard.state.currentFilteredData);
        } catch (err) {
            console.error('[loadLogs]', err);
            const tbody = document.getElementById('tableBody');
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#f87171;padding:20px;">❌ ไม่สามารถโหลด Logs ได้ — ${err.message}</td></tr>`;
        }
    },

    filterLogs: () => {
        Table.state.currentPage = 1;
        Dashboard.loadLogs();
    },

    renderLogs: (data) => {
        Table.setHeaders(['LOG_ID', 'USER_ID', 'USERNAME', 'ACTION', 'IP', 'STATUS', 'เวลา']);
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        if (!data || data.length === 0) { Table.showEmpty(7); return; }

        Table.getPaginatedData(data).forEach(row => {
            const tr = document.createElement('tr');
            const statusColor = {
                'SUCCESS'       : '#4ade80',
                'NOT_FOUND'     : '#f87171',
                'WRONG_PASSWORD': '#fb923c',
                'DEACTIVATED'   : '#a78bfa',
            }[row.STATUS || row.status] || '#94a3b8';

            tr.innerHTML = `
                <td>${row.id          || row.log_id    || '-'}</td>
                <td>${row.USER_ID     || row.user_id   || '-'}</td>
                <td>${row.USERNAME    || row.username  || '-'}</td>
                <td>${row.ACTION      || row.action    || '-'}</td>
                <td>${row.CLIENT_IP   || row.client_ip || '-'}</td>
                <td style="color:${statusColor};font-weight:bold;">${(row.STATUS || row.status || '-').toUpperCase()}</td>
                <td>${formatDate(row.LOG_TIME || row.log_time)}</td>
            `;
            tbody.appendChild(tr);
        });
        Table.setupPagination(data.length);
    },
};

document.addEventListener('DOMContentLoaded', Dashboard.init);