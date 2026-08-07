// public/js/lights_main.js - Диригент на табовете за осветление
let activeLightsTab = 'tab1';

function switchTab(evt, tabId) {
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => p.style.display = 'none');

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));

    document.getElementById(tabId).style.display = 'block';
    evt.currentTarget.classList.add('active');
    activeLightsTab = tabId;

    if (tabId === 'tab1') refreshLightsTab1();
    if (tabId === 'tab2') refreshLightsTab2();
}

// Закачане на общите бутони най-горе
document.getElementById('globalRefreshBtn').addEventListener('click', () => {
    if (activeLightsTab === 'tab1') refreshLightsTab1();
    if (activeLightsTab === 'tab2') refreshLightsTab2();
});

document.getElementById('globalExportBtn').addEventListener('click', () => {
    if (activeLightsTab === 'tab1') exportLightsTab1();
    if (activeLightsTab === 'tab2') exportLightsTab2();
});

// Универсално разтягане с мишката
function initResizableColumns(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    const cols = table.querySelectorAll('th');
    cols.forEach(col => {
        const resizer = col.querySelector('.resizer');
        if (!resizer) return;
        let startX, startWidth;
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            startX = e.pageX; startWidth = col.offsetWidth;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        function onMouseMove(e) {
            const width = startWidth + (e.pageX - startX);
            if (width > 50) col.style.width = width + 'px';
        }
        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    refreshLightsTab1();
});
