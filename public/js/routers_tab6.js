// public/js/routers_tab6.js - Раздел 6. Електромери

let tab6Data = [];

function refreshTab6() {
    tab6Data = [
        { meter_id: 1, location: "Трафопост Център", total_kwh: 4523.8, current_kw: 12.4 },
        { meter_id: 2, location: "Трафопост Южен", total_kwh: 8912.1, current_kw: 8.2 }
    ];
    renderTab6Table(tab6Data);
}

function renderTab6Table(data) {
    const tbody = document.getElementById('bodyEnergyMeters');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.meter_id}</td><td>${row.location}</td><td style="font-weight:bold; color:#0056b3;">${row.total_kwh} kWh</td><td>${row.current_kw} kW</td>`;
        tbody.appendChild(tr);
    });
    initResizableColumns('tableEnergyMeters');
}

function exportTab6() {
    alert('Експорт на Електромери (Таб 6)...');
}
