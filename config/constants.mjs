// config/constants.mjs

export const PRIVILEGE = Object.freeze({
    OPERATOR: 0,
    SERVIZ: 1,   // Остава за съвместимост, ако потрябва
    CONFIG: 2    // Твоят Администратор
});

// Тук умишлено можеш да си добавиш и други #define еквиваленти за проекта по-късно
export const APP_PORT = 8000;
