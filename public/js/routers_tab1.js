// public/js/routers_tab1.js - Бизнес логика за Таймери (БД)

let tab1Data = [];
let selectedTimerId = null;

function refreshTab1() {
    // В реалния софтуер тук ще извикаме fetch към твоето MySQL API
    // За скелета слагаме примерни чисти данни
    tab1Data = [
        { id_timer: 1, name_timer: "Лятно градско", time_on: "21:15", time_off: "05:00" },
        { id_timer: 2, name_timer: "Зимно промишлено", time_on: "17:30", time_off: "07:15" }
    ];
    renderTab1Table(tab1Data);
    initResizableColumns('tableTimersDb');
}

function renderTab1Table(data) {
    const tbody = document.getElementById('bodyTimersDb');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${row.id_timer}</td><td style="font-weight:bold; color:#0056b3;">${row.name_timer}</td><td>${row.time_on}</td><td>${row.time_off}</td>`;
        
        tr.addEventListener('click', () => {
            document.querySelectorAll('#tableTimersDb tbody tr').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');
            selectedTimerId = row.id_timer;
        });
        tbody.appendChild(tr);
    });
}

function exportTab1() {
    alert('Експорт на шаблони за таймери към CSV...');
}
