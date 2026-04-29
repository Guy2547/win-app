/**
 * Modal Component
 * Reusable modal popup for confirmations, alerts, and errors.
 */
const Modal = {
    show: (title, text, type = 'confirm') => {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-modal');
            const iconEl = document.getElementById('modal-icon');
            const titleEl = document.getElementById('modal-title');
            const textEl = document.getElementById('modal-text');
            const btnCancel = document.getElementById('btn-modal-cancel');
            const btnConfirm = document.getElementById('btn-modal-confirm');

            titleEl.innerText = title;
            textEl.innerText = text;

            if (type === 'success') {
                iconEl.innerText = '✅';
                btnCancel.style.display = 'none';
                btnConfirm.innerText = 'ตกลง';
                btnConfirm.style.background = 'var(--success)';
                btnConfirm.style.color = '#0f172a';
            } else if (type === 'error') {
                iconEl.innerText = '❌';
                btnCancel.style.display = 'none';
                btnConfirm.innerText = 'รับทราบ';
                btnConfirm.style.background = 'var(--danger)';
                btnConfirm.style.color = 'white';
            } else {
                iconEl.innerText = '⚠️';
                btnCancel.style.display = 'block';
                btnConfirm.innerText = 'ยืนยัน';
                btnConfirm.style.background = 'var(--primary)';
                btnConfirm.style.color = '#0f172a';
            }

            overlay.classList.add('show');

            btnConfirm.onclick = () => {
                overlay.classList.remove('show');
                resolve(true);
            };

            btnCancel.onclick = () => {
                overlay.classList.remove('show');
                resolve(false);
            };
        });
    },

    success: (title, text) => Modal.show(title, text, 'success'),

    error: (title, text) => Modal.show(title, text, 'error'),

    confirm: (title, text) => Modal.show(title, text, 'confirm')
};
