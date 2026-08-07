// public/js/routers_tab3.js - Раздел 3. Осветители

let tab3Data = [];

function refreshTab3() {
    // Скелетни данни за уличните осветители под диригентството на рутера
    tab3Data = [
        { id_lamp: 1, mac_lamp: "02158D00009478A1", status_lamp: "Включена", lqi: 120 },
        { id_lamp: 2, mac_lamp: "02158D00009478B2", status_lamp: "Изключена", lqi: 95 }
    ];
    renderTab3Table(tab3Data);
    // Ако си направил таблица в HTML със съответното ID:
    // initResizableColumns('tableRoutersLamps');
}

function renderTab3Table(data) {
    const tbody = document.getElementById('bodyRoutersLamps');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.id_lamp}</td><td style="font-family:monospace; font-weight:bold; color:#0056b3;">${row.mac_lamp}</td><td>${row.status_lamp}</td><td>${row.lqi}</td>`;
        tbody.appendChild(tr);
    });
    initResizableColumns('tableRoutersLamps');
}

function exportTab3() {
    alert('Експорт на Осветители (Таб 3)...');
}
