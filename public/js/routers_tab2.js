// public/js/routers_tab2.js - Таймери прикачени към физическите хардуери

let tab2Data = [];
let selectedHardwareId = null;

function refreshTab2() {
    // Примерни данни, извлечени от таблицата hardwares, показващи твоя stop флаг!
    tab2Data = [
        { id_hardware: 1, ip: "192.168.1.79", location: "Трафопост Център", active_timer: "Лятно градско", stop: 0 },
        { id_hardware: 2, ip: "192.168.1.80", location: "Трафопост Северен", active_timer: "Няма закачен", stop: 1 },
        { id_hardware: 3, ip: "192.168.1.81", location: "Трафопост Южен", active_timer: "Зимно промишлено", stop: 0 }
    ];
    renderTab2Table(tab2Data);
    initResizableColumns('tableTimersHard');
}

function renderTab2Table(data) {
    const tbody = document.getElementById('bodyTimersHard');
    tbody.innerHTML = '';
    
    data.forEach(row => {
        const tr = document.createElement('tr');
        // Ако stop е 1, маркираме текста в червено за аларма
        const stopStyle = row.stop === 1 ? 'color: red; font-weight:bold;' : 'color: green;';
        const stopText = row.stop === 1 ? '🚨 Спрян (1)' : '✅ Жив (0)';

        tr.innerHTML = `<td>${row.ip}</td><td>${row.location}</td><td>${row.active_timer}</td><td style="${stopStyle}">${stopText}</td>`;
        
        tr.addEventListener('click', () => {
            document.querySelectorAll('#tableTimersHard tbody tr').forEach(r => r.classList.remove('selected'));
            tr.classList.add('selected');
            selectedHardwareId = row.id_hardware;
        });
        tbody.appendChild(tr);
    });
}

// Демонстрация на твоя умен превключвател при натискане на бутона "Изпрати таймер"
function sendTimerAction() {
    const scope = document.querySelector('input[name="actionScope"]:checked').value;
    
    if (scope === 'row') {
        if (!selectedHardwareId) return alert('Грешка: Моля, маркирайте конкретен ред от таблицата!');
        const target = tab2Data.find(h => h.id_hardware === selectedHardwareId);
        alert(`📤 Изпращам команда по REST API САМО към маркираното устройство: IP ${target.ip}`);
    } else {
        // Логиката за цялата таблица, изключваща любимия ти stop!
        const liveDevices = tab2Data.filter(h => h.stop === 0);
        const ips = liveDevices.map(h => h.ip).join(', ');
        alert(`📤 МАСОВА КОМАНДА: Изпращам таймера към ВСИЧКИ живи устройства в мрежата (общо ${liveDevices.length} броя на адреси: ${ips}). Спрените обекти (stop=1) са игнорирани успешно!`);
    }
}

function exportTab2() {
    alert('Експорт на хардуерните таймери...');
}
