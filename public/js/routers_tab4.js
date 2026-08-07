// public/js/routers_tab4.js - Раздел 4. Връзки

let tab4Data = [];

function refreshTab4() {
    tab4Data = [
        { from_node: "Рутер Център", to_node: "Лампа 1", quality: "Отлично (LQI 125)" },
        { from_node: "Лампа 1", to_node: "Лампа 2", quality: "Добро (LQI 98)" }
    ];
    renderTab4Table(tab4Data);
}

function renderTab4Table(data) {
    const tbody = document.getElementById('bodyMeshLinks');
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.from_node}</td><td>${row.to_node}</td><td style="font-weight:bold; color:green;">${row.quality}</td><td>${row.per} %</td>`;
        tbody.appendChild(tr);
    });
    initResizableColumns('tableMeshLinks');
}

function exportTab4() {
    alert('Експорт на Връзки (Таб 4)...');
}
