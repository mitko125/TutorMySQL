// public/js/lights_tab1.js - Бизнес логика за Улични осветители

let tab1LightsData = [];
let selectedLightId = null;

function refreshLightsTab1() {
    // Подготвяме скелетни данни - готови за твоя бъдещ fetch към MySQL
    tab1LightsData = [
        { id_lamp: 101, mac: "02158D00009478A1", street: "бул. Георги Данчев", num: "12", model_id: 1, status: "Включена" },
        { id_lamp: 102, mac: "02158D00009478B2", street: "ул. Раковски", num: "45", model_id: 2, status: "Изключена" },
        { id_lamp: 103, mac: "02158D00009478C3", street: "бул. Цар Симеон", num: "2", model_id: 1, status: "Включена" }
    ];
    renderLightsTab1Table(tab1LightsData);
    initResizableColumns('tableLightsList');
}

function renderLightsTab1Table(data) {
    const tbody = document.getElementById('bodyLightsList');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.id_lamp}</td>
            <td style="font-family:monospace; font-weight:bold; color:#0056b3;">${row.mac}</td>
            <td>${row.street}</td>
            <td>${row.num}</td>
            <td>Модел #${row.model_id}</td>
            <td>${row.status}</td>
        `;
        
        tr.addEventListener('click', () => {
            document.querySelectorAll('#tableLightsList tbody tr').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');
            selectedLightId = row.id_lamp;
        });
        tbody.appendChild(tr);
    });
}

// Демонстрация на твоя умен превключвател Ляво/Дясно за лампите
function sendLightCommand() {
    const scope = document.querySelector('input[name="lightActionScope"]:checked').value;
    
    if (scope === 'row') {
        if (!selectedLightId) return alert('Грешка: Моля, маркирайте конкретна лампа от таблицата!');
        alert(`📤 Изпращам команда по REST API само към МАРКИРАНОТО осветително тяло №${selectedLightId}`);
    } else {
        alert(`📤 МАСОВА КОМАНДА: Изпращам сигнал към ВСИЧКИ улични осветители в мрежата! Спрените обекти (stop=1) са филтрирани автоматично на заден план.`);
    }
}

function exportLightsTab1() {
    alert('Експорт на списъка с улични осветители към CSV...');
}
