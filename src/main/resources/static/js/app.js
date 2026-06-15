const ApiClient = (function () {
    const baseUrl = '/api';
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    async function request(method, endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
        const config = {
            method,
            headers: { ...defaultHeaders, ...(options.headers || {}) },
            credentials: 'same-origin'
        };

        if (options.body !== undefined && method !== 'GET') {
            config.body = typeof options.body === 'string'
                ? options.body
                : JSON.stringify(options.body);
        }

        if (options.params) {
            const query = new URLSearchParams(options.params).toString();
            if (query) url += `?${query}`;
        }

        try {
            const response = await fetch(url, config);
            const contentType = response.headers.get('content-type');
            const data = contentType && contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                const message = data?.message || data || `HTTP ${response.status}`;
                throw new Error(message);
            }

            return { success: true, data, status: response.status };
        } catch (error) {
            console.error(`[API] ${method} ${url} 失败:`, error);
            return { success: false, error: error.message, data: null };
        }
    }

    return {
        get: (endpoint, params) => request('GET', endpoint, { params }),
        post: (endpoint, body, headers) => request('POST', endpoint, { body, headers }),
        put: (endpoint, body, headers) => request('PUT', endpoint, { body, headers }),
        delete: (endpoint, body) => request('DELETE', endpoint, { body }),
        patch: (endpoint, body) => request('PATCH', endpoint, { body })
    };
})();

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    const modal = bootstrap.Modal.getOrCreateInstance(el);
    modal.show();
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    const modal = bootstrap.Modal.getInstance(el);
    if (modal) modal.hide();
}

function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(el => {
        const modal = bootstrap.Modal.getInstance(el);
        if (modal) modal.hide();
    });
}

function renderProgressBars() {
    const bars = document.querySelectorAll('.progress-bar-custom');
    bars.forEach(bar => {
        const rate = parseInt(bar.dataset.rate, 10);
        const width = parseInt(bar.style.width || '0', 10);
        const value = isNaN(rate) ? width : rate;

        bar.classList.remove('bg-success', 'bg-warning', 'bg-danger');
        if (value >= 70) {
            bar.classList.add('bg-success');
        } else if (value >= 40) {
            bar.classList.add('bg-warning');
        } else {
            bar.classList.add('bg-danger');
        }
    });
}

function exportData(data, filename, type = 'text/csv;charset=utf-8;') {
    if (Array.isArray(data)) {
        data = convertToCSV(data);
    }

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + data], { type });

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`文件 "${filename}" 已开始下载`, 'success');
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [];

    csvRows.push(headers.map(h => `"${h}"`).join(','));

    data.forEach(row => {
        const values = headers.map(h => {
            let val = row[h] ?? '';
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}

function showToast(message, type = 'info', duration = 3000) {
    const containerId = 'appToastContainer';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    const colorMap = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning text-dark',
        info: 'bg-info text-dark'
    };
    const iconMap = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    const toastId = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toastEl = document.createElement('div');
    toastEl.id = toastId;
    toastEl.className = `toast align-items-center text-white border-0 ${colorMap[type] || colorMap.info}`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${iconMap[type] || iconMap.info} me-2 fs-5"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: duration, autohide: true });
    toastEl.addEventListener('hidden.bs.toast', () => {
        toastEl.remove();
    });
    toast.show();
}

function confirmDialog(message, title = '操作确认') {
    return new Promise((resolve) => {
        const modalId = `confirm_${Date.now()}`;
        const modalEl = document.createElement('div');
        modalEl.id = modalId;
        modalEl.className = 'modal fade';
        modalEl.setAttribute('tabindex', '-1');
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0 rounded-4">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold"><i class="bi bi-question-circle text-primary me-2"></i>${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body px-4 pb-4">
                        <p class="mb-0">${message}</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="${modalId}_cancel">取消</button>
                        <button type="button" class="btn btn-primary" id="${modalId}_ok">确定</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);

        const modal = new bootstrap.Modal(modalEl);
        let resolved = false;

        function cleanup(result) {
            if (resolved) return;
            resolved = true;
            modal.hide();
            setTimeout(() => modalEl.remove(), 300);
            resolve(result);
        }

        document.getElementById(`${modalId}_cancel`).addEventListener('click', () => cleanup(false));
        document.getElementById(`${modalId}_ok`).addEventListener('click', () => cleanup(true));
        modalEl.addEventListener('hidden.bs.modal', () => cleanup(false));

        modal.show();
    });
}

function formatDate(date, format = 'YYYY-MM-DD') {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';

    const pad = n => String(n).padStart(2, '0');
    const tokens = {
        YYYY: d.getFullYear(),
        MM: pad(d.getMonth() + 1),
        DD: pad(d.getDate()),
        HH: pad(d.getHours()),
        mm: pad(d.getMinutes()),
        ss: pad(d.getSeconds())
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => tokens[match]);
}

function timeAgo(time) {
    const now = Date.now();
    const target = new Date(time).getTime();
    const diff = Math.floor((now - target) / 1000);

    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`;
    return formatDate(time);
}

function debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

function throttle(fn, delay = 300) {
    let last = 0;
    return function (...args) {
        const now = Date.now();
        if (now - last >= delay) {
            last = now;
            fn.apply(this, args);
        }
    };
}

document.addEventListener('DOMContentLoaded', function () {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverTriggerList.forEach(el => new bootstrap.Popover(el));

    renderProgressBars();
});

window.App = {
    ApiClient,
    openModal,
    closeModal,
    closeAllModals,
    renderProgressBars,
    exportData,
    convertToCSV,
    showToast,
    confirmDialog,
    formatDate,
    timeAgo,
    debounce,
    throttle
};
