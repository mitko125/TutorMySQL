// public/js/routers_main.js - Диригент на еластичните табовете
let activeTabGlobal = 'tab1';

function switchTab(evt, tabId) {
    const panes = document.querySelectorAll('.tab-pane');
    panes.forEach(p => p.style.display = 'none');

    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(b => b.classList.remove('active'));

    document.getElementById(tabId).style.display = 'block';
    evt.currentTarget.classList.add('active');
    activeTabGlobal = tabId; // Запазваме активния таб

    if (tabId === 'tab1') refreshTab1();
    if (tabId === 'tab2') refreshTab2();
    if (tabId === 'tab3') refreshTab3();
    if (tabId === 'tab4') refreshTab4();
    if (tabId === 'tab5') refreshTab5();
    if (tabId === 'tab6') refreshTab6();
}

// Закачаме общите бутони от заглавния ред към активните функции
document.getElementById('globalRefreshBtn').addEventListener('click', () => {
    if (activeTabGlobal === 'tab1') refreshTab1();
    if (activeTabGlobal === 'tab2') refreshTab2();
    if (activeTabGlobal === 'tab3') refreshTab3();
    if (activeTabGlobal === 'tab4') refreshTab4();
    if (activeTabGlobal === 'tab5') refreshTab5();
    if (activeTabGlobal === 'tab6') refreshTab6();
});

document.getElementById('globalExportBtn').addEventListener('click', () => {
    if (activeTabGlobal === 'tab1') exportTab1();
    if (activeTabGlobal === 'tab2') exportTab2();
    if (activeTabGlobal === 'tab3') exportTab3();
    if (activeTabGlobal === 'tab4') exportTab4();
    if (activeTabGlobal === 'tab5') exportTab5();
    if (activeTabGlobal === 'tab6') exportTab6();
});

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
    refreshTab1();
});
