// public/js/lights_tab2.js - Бизнес логика за Модели улични лампи

let tab2ModelsData = [];

function refreshLightsTab2() {
    tab2ModelsData = [
        { id_model: 1, name: "Philips Luma LED", power: 150, vendor: "Philips Lighting" },
        { id_model: 2, name: "Schreder Teceo", power: 90, vendor: "Schreder Group" }
    ];
    renderModelsTable(tab2ModelsData);
    initResizableColumns('tableLightModels');
}

function renderModelsTable(data) {
    const tbody = document.getElementById('bodyLightModels');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.id_model}</td><td style="font-weight:bold; color:#0056b3;">${row.name}</td><td>${row.power} W</td><td>${row.vendor}</td>`;
        tbody.appendChild(tr);
    });
}

// Сортиране по колони за Таб 2 (можеш да си го развиеш по модела на отчетите)
function exportLightsTab2() {
    alert('Експорт на номенклатурата от модели към CSV...');
}
