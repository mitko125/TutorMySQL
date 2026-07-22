document.addEventListener('DOMContentLoaded', () => {
    // Автоматично откриваме дали сме в подпапка (settings/reports) или в главната папка
    const isInSubfolder = window.location.pathname.includes('/settings/') || window.location.pathname.includes('/reports/');
    const prefix = isInSubfolder ? '../' : '';

    let menuContainer = document.getElementById('mainMenu');
    if (!menuContainer) {
        menuContainer = document.createElement('div');
        menuContainer.id = 'mainMenu';
        document.body.insertBefore(menuContainer, document.body.firstChild);
    }

    menuContainer.innerHTML = `
        <div class="navbar" style="background-color: #0056b3; padding: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div class="nav-left" style="display: flex; gap: 15px;">
                <span style="color: white; font-weight: bold; margin-right: 15px;">🚦 StreetLights Master</span>
                
                <!-- Меню Настройки -->
                <div class="dropdown" style="position: relative; display: inline-block;">
                    <button class="dropbtn" style="background: none; border: none; color: white; font-weight: bold; cursor: pointer;">Настройки ▾</button>
                    <div class="dropdown-content" style="display: none; position: absolute; background-color: #f1f1f1; min-width: 180px; box-shadow: 0px 8px 16px rgba(0,0,0,0.2); z-index: 1000;">
                        <a href="${prefix}settings/routers.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Рутери</a>
                        <a href="${prefix}settings/lights.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Улични осветители</a>
                        <hr style="margin: 0; border-color: #ccc;">
                        <a href="${prefix}settings/operators.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Оператори</a>
                        <a href="${prefix}settings/station.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Номер работно място</a>
                        <a href="${prefix}settings/db_config.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Връзка с база данни</a>
                    </div>
                </div>

                <!-- Меню Отчети -->
                <div class="dropdown" style="position: relative; display: inline-block;">
                    <button class="dropbtn" style="background: none; border: none; color: white; font-weight: bold; cursor: pointer;">Отчети ▾</button>
                    <div class="dropdown-content" style="display: none; position: absolute; background-color: #f1f1f1; min-width: 180px; box-shadow: 0px 8px 16px rgba(0,0,0,0.2); z-index: 1000;">
                        <a href="${prefix}reports/system_log.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Система</a>
                        <a href="${prefix}reports/lqi_test.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Тест LQI</a>
                        <a href="${prefix}reports/delete_logs.html" style="color: black; padding: 12px 16px; text-decoration: none; display: block;">Изтриване на отчетите</a>
                    </div>
                </div>
            </div>

            <!-- Смяна на оператор (Logout) -->
            <div class="nav-right">
                <button id="globalLogoutBtn" style="background-color: #d9534f; color: white; border: none; padding: 6px 12px; cursor: pointer; font-weight: bold;">🔄 Смяна на оператор</button>
            </div>
        </div>
    `;

    // Логика за падащите менюта
    const dropdowns = menuContainer.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropbtn');
        const content = dropdown.querySelector('.dropdown-content');
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdowns.forEach(d => { if(d !== dropdown) d.querySelector('.dropdown-content').style.display = 'none'; });
            content.style.display = (content.style.display === 'block') ? 'none' : 'block';
        });
    });

    window.addEventListener('click', () => {
        dropdowns.forEach(d => d.querySelector('.dropdown-content').style.display = 'none');
    });

    // Логика за бутона "Смяна на оператор"
    document.getElementById('globalLogoutBtn').addEventListener('click', () => {
        fetch('/api/logout', { method: 'POST' })
            .then(() => {
                window.location.href = prefix + 'index.html';
            });
    });

    // Ако базата е офлайн, скриваме менютата на мига
    fetch('/api/db-status')
        .then(res => res.json())
        .then(status => {
            if (!status.online) {
                dropdowns.forEach(d => d.style.display = 'none');
                document.getElementById('globalLogoutBtn').style.display = 'none';
            }
        });
});
