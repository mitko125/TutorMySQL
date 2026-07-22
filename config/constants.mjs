// config/constants.mjs

export const PRIVILEGE = Object.freeze({
    OPERATOR: 0,
    SERVIZ: 1,
    CONFIG: 2
});

export const APP_PORT = 8000;

// Твоят C++ enum за събитията, преведен на JavaScript
export const CONFIG_MESSAGES = Object.freeze({
    _CONFIG_ROUTERS: 0,
    _CONFIG_LAMPS: 1,
    _CONFIG_OPERATORS: 2,
    _CONFIG_PC_NUMBER: 3,
    _CONFIG_CONNECTION_DB: 4,
    _CLEAR_ACCOUNTS: 5,
    _CONFIG_ENERGY_METERS: 6
});

// Еквивалентът на твоите Windows String Resources (IDS_...)
export const CONFIG_MESSAGES_TEXT = Object.freeze({
    [CONFIG_MESSAGES._CONFIG_ROUTERS]: "Промяна на рутерите",
    [CONFIG_MESSAGES._CONFIG_LAMPS]: "Промяна на улични осветители",
    [CONFIG_MESSAGES._CONFIG_OPERATORS]: "Промяна на операторите",
    [CONFIG_MESSAGES._CONFIG_PC_NUMBER]: "Промяна номера на работното място",
    [CONFIG_MESSAGES._CONFIG_CONNECTION_DB]: "Промяна връзката с база данни",
    [CONFIG_MESSAGES._CLEAR_ACCOUNTS]: "Изтриване на отчетите",
    [CONFIG_MESSAGES._CONFIG_ENERGY_METERS]: "Промени в електромерите",
    "UNKNOWN": "Неизвестно събитие !!!"
});
