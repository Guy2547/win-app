/**
 * Table Component
 * Handles table rendering, pagination, and common table interactions.
 */
const Table = {
    state: {
        currentPage: 1,
        rowsPerPage: 10
    },

    onPageChange: null,

    setHeaders: (columns) => {
        const header = document.getElementById('tableHeader');
        const tr = document.createElement('tr');
        columns.forEach(col => {
            const th = document.createElement('th');
            th.innerText = col;
            tr.appendChild(th);
        });
        header.innerHTML = '';
        header.appendChild(tr);
    },

    clear: () => {
        document.getElementById('tableBody').innerHTML = '';
    },

    showLoading: (colspan = 7) => {
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;">⏳ กำลังโหลดข้อมูล...</td></tr>`;
    },

    showError: (colspan = 7) => {
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: var(--danger);">❌ ไม่สามารถเชื่อมต่อกับ API ได้</td></tr>`;
    },

    showEmpty: (colspan = 7, message = 'ไม่พบข้อมูล') => {
        document.getElementById('tableBody').innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">${message}</td></tr>`;
        document.getElementById('paginationControls').innerHTML = '';
    },

    render: (rows) => {
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';

        if (rows.length === 0) {
            Table.showEmpty();
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.innerHTML = row;
            tbody.appendChild(tr);
        });
    },

    setupPagination: (totalRows) => {
        const paginationDiv = document.getElementById('paginationControls');
        paginationDiv.innerHTML = '';

        const totalPages = Math.ceil(totalRows / Table.state.rowsPerPage);
        if (totalRows === 0 || totalPages === 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '&#10094;';
        prevBtn.className = `page-item ${Table.state.currentPage === 1 ? 'disabled' : ''}`;
        prevBtn.onclick = () => {
            if (Table.state.currentPage > 1) {
                Table.state.currentPage--;
                Table.onPageChange?.();
            }
        };
        paginationDiv.appendChild(prevBtn);

        let pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (Table.state.currentPage <= 4) {
                pages = [1, 2, 3, 4, 5, '...', totalPages];
            } else if (Table.state.currentPage >= totalPages - 3) {
                pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
            } else {
                pages = [1, '...', Table.state.currentPage - 1, Table.state.currentPage, Table.state.currentPage + 1, '...', totalPages];
            }
        }

        pages.forEach(p => {
            const pageBtn = document.createElement('div');
            if (p === '...') {
                pageBtn.innerText = '...';
                pageBtn.className = 'page-item ellipsis';
            } else {
                pageBtn.innerText = p;
                pageBtn.className = `page-item ${p === Table.state.currentPage ? 'active' : ''}`;
                pageBtn.onclick = () => {
                    Table.state.currentPage = p;
                    Table.onPageChange?.();
                };
            }
            paginationDiv.appendChild(pageBtn);
        });

        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '&#10095;';
        nextBtn.className = `page-item ${Table.state.currentPage === totalPages ? 'disabled' : ''}`;
        nextBtn.onclick = () => {
            if (Table.state.currentPage < totalPages) {
                Table.state.currentPage++;
                Table.onPageChange?.();
            }
        };
        paginationDiv.appendChild(nextBtn);

        const selectDiv = document.createElement('select');
        selectDiv.className = 'per-page-select';
        [10, 20, 50, 100].forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.innerText = `${val} / page`;
            if (val === Table.state.rowsPerPage) opt.selected = true;
            selectDiv.appendChild(opt);
        });

        selectDiv.onchange = (e) => {
            Table.state.rowsPerPage = parseInt(e.target.value, 10);
            Table.state.currentPage = 1;
            Table.onPageChange?.();
        };

        paginationDiv.appendChild(selectDiv);
    },

    getPaginatedData: (data) => {
        const startIndex = (Table.state.currentPage - 1) * Table.state.rowsPerPage;
        const endIndex = startIndex + Table.state.rowsPerPage;
        return data.slice(startIndex, endIndex);
    },

    reset: () => {
        Table.state.currentPage = 1;
        Table.state.rowsPerPage = 10;
        Table.onPageChange = null;
    }
};
