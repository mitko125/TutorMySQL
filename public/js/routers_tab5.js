// public/js/routers_tab5.js - Раздел 5. Рутери (Хардуери)

let tab5Data = [];

function refreshTab5() {
    tab5Data = [
        { id_router: 1, name_router: "Координатор Център", hardware_ver: "v3.1", gprs_status: "Онлайн" },
        { id_router: 2, name_router: "Координатор Северен", hardware_ver: "v3.0", gprs_status: "Офлайн" }
    ];
    renderTab5Table(tab5Data);
}

function renderTab5Table(data) {
    const tbody = document.getElementById('bodyHardwaresList');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.id_router}</td><td style="font-weight:bold; color:#0056b3;">${row.name_router}</td><td>${row.hardware_ver}</td><td>${row.gprs_status}</td>`;
        tbody.appendChild(tr);
    });
    initResizableColumns('tableHardwaresList');
}

function exportTab5() {
    alert('Експорт на Рутери (Таб 5)...');
}
