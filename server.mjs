import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './config/db.mjs';
import { codePassword, decodePassword } from './utils/crypto.mjs';
import { PRIVILEGE, APP_PORT } from './config/constants.mjs';
import { CONFIG_MESSAGES } from './config/constants.mjs';
import { CONFIG_MESSAGES_TEXT } from './config/constants.mjs';

// Регенериране на __dirname, тъй като липсва в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// За да можем да четем JSON данни изпратени от HTML фронтенда
app.use(express.json());

const activeSessions = {}; // Твоята база от данни за влезли IP адреси в паметта

// ==========================================
// 🛡️ ТВОЯТ ПЪРВИ БАКЕНД MIDDLEWARE КОНТРОЛЬОР
// ==========================================
function checkAdminRights(req, res, next) {
    const clientIp = req.ip;
    const session = activeSessions[clientIp];
    
    // 1. Проверяваме дали базата данни е онлайн
    const isDbOnline = db.checkDbStatus(); 

    // АКО БАЗАТА Е СЧУПЕНА: Пускаме САМО до конфигурационния файл, без значение кой пита
    if (!isDbOnline) {
        if (req.path === '/db_config.html') {
            return next(); 
        } else {
            return res.redirect('/index.html?error=no_connection'); 
        }
    }

    // 2. АКО БАЗАТА Е ОНЛАЙН: Проверяваме дали потребителят изобщо е влязъл в системата
    if (!session) {
        console.log(`🛡️ Middleware спря неоторизиран опит за достъп до: ${req.baseUrl}${req.path} от IP: ${clientIp}`);
        return res.redirect('/index.html?error=no_rights');
    }

    // 3. ЖЕЛЯЗНО РАЗПРЕДЕЛЕНИЕ НА ПРАВАТА ПО ПАПКИ:
    
    // А) Ако се опитва да влезе в папка "settings" (Настройки) -> Трябва да е твърдо ниво 2 (CONFIG)
    if (req.baseUrl === '/settings') {
        if (session.privilege !== PRIVILEGE.CONFIG) {
            console.log(`🔒 Оператор ${session.name} (Ниво ${session.privilege}) се опита да влезе в настройките, но изискваме Ниво 2!`);
            return res.redirect('/index.html?error=no_rights');
        }
    }
    
    // Б) Ако се опитва да влезе в папка "reports" (Отчети)
    if (req.baseUrl === '/reports') {
        
        // 🚷 СПЕЦИАЛЕН КАТИНАР ЗА ИЗТРИВАНЕ:
        // Ако се опитва да отвори точно файла за триене на отчети -> Изискваме твърдо Ниво 2 (CONFIG)!
        if (req.path === '/delete_logs.html') {
            if (session.privilege !== PRIVILEGE.CONFIG) {
                console.log(`🔒 Оператор ${session.name} (Ниво ${session.privilege}) се опитва да изтрие отчети, но изискваме Ниво 2!`);
                return res.redirect('/index.html?error=no_rights'); // Изхвърляне!
            }
        }
        
        // За всички ОСТАНАЛИ отчети (като системния лог и LQI теста) -> Трябва да е поне Ниво 1 (SERVIZ)
        if (session.privilege < PRIVILEGE.SERVIZ) { 
            console.log(`🔒 Оператор ${session.name} (Ниво ${session.privilege}) се опита да чете отчети, но няма право!`);
            return res.redirect('/index.html?error=no_rights'); // Изхвърляне за Ниво 0
        }
    }

    // Ако всички проверки минат успешно -> "Пътят е чист, дай му файла!"
    next();
}

// ЗАДЪЛЖИТЕЛНО ПРАВИЛО ЗА СИГУРНОСТ: Заключваме папките "settings" и "reports" с нашия Middleware!
// Всеки път, когато браузърът поиска файл от там, първо ще се изпълни функцията checkAdminRights
app.use('/settings', checkAdminRights);
app.use('/reports', checkAdminRights);

// СЛЕД КАТО СМЕ СЛОЖИЛИ КАТИНАРИТЕ НА ПАПКИТЕ, ЧАК ТОГАВА ИЗГРАЖДАМЕ ОБЩИЯ ДОСТЪП ДО PUBLIC
// Споделяне на статичните HTML/CSS/JS файлове от папка "public"
app.use(express.static(path.join(__dirname, 'public')));

// Обновяваме вземането на оператори с автоматично чистене
app.get('/api/operators', (req, res) => {
    const clientIp = req.ip;
    
    // АВТОМАТИЧНО ЧИСТЕНЕ: Щом потребителят е на началния екран и зарежда менюто,
    // изтриваме старата му сесия в бакенда, за да няма застъпване на права!
    if (activeSessions[clientIp]) {
        delete activeSessions[clientIp];
        console.log(`🧹 Автоматично изчистена стара сесия за IP: ${clientIp}`);
    }

    if (!db.checkDbStatus()) {
        return res.status(503).json({ error: 'Няма връзка с базата данни' });
    }
    const connection = db.getConn();
    connection.query('SELECT id_operator, name_operator, privilege FROM operators', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Ендпойнт 2: Влизане в системата (Проверка на парола), При Влизане (Login) - заключваме правата в бакенда
app.post('/api/login', (req, res) => {
    const { id_operator, password } = req.body;
    const clientIp = req.ip; // Вземаме IP адреса на компютъра
    
    const connection = db.getConn();
    connection.query('SELECT * FROM operators WHERE id_operator = ?', [id_operator], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Няма такъв оператор' });
        
        const operator = results[0]; // Вземаме намерения оператор от масива
        
        // Извикваме твоята декриптираща функция, която е скрита в utils/crypto.mjs (или е в server.mjs)
        const decryptedDbPassword = decodePassword(operator.password_operator);
        
        // Сравняваме я с въведената от потребителя
        if (decryptedDbPassword === password) {
            activeSessions[clientIp] = {
                id_operator: operator.id_operator,
                name: operator.name_operator,
                privilege: operator.privilege,
                old_clientIp: null,
                old_typeConfig: null
            };
            res.json({ success: true, privilege: operator.privilege, name: operator.name_operator });
        } else {
            res.json({ success: false, message: 'Грешна парола!' });
        }
    });
});

// В server.mjs - Ендпоинт за изчистване на сесията (Logout)
app.post('/api/logout', (req, res) => {
    const clientIp = req.ip;
    if (activeSessions[clientIp]) {
        delete activeSessions[clientIp]; // Изтриваме IP-то от списъка на влезлите!
        console.log(`🚪 Операторът от IP: ${clientIp} излезе успешно.`);
    }
    res.json({ success: true });
});

// 1. Временен тест на MySQL в паметта
app.post('/api/mysql/test', (req, res) => {
    const { host, user, password, database } = req.body;
    db.updateConfigInMemory({ host, user, password, database });
    res.json({ success: true, message: 'Настройките са променени в паметта!' });
});

// Обновяваме статус ендпоинта
app.get('/api/db-status', (req, res) => {
    res.json({ 
        online: db.checkDbStatus(),
        config: db.getCurrentConfig() // Пращаме текущите настройки към HTML-а
    });
});

// Ендпойнт за перманентно записване от Администратор
app.post('/api/mysql/save', (req, res) => {
    const clientIp = req.ip;
    const session = activeSessions[clientIp];

    // Желязна проверка за права (Ниво 2)
    if (!session || session.privilege !== PRIVILEGE.CONFIG) {
        return res.status(403).json({ success: false, message: 'Нямате права!' });
    }

    const { host, user, password, database } = req.body;
    try {
        // Най-правилно, първо в старата БД, кай я е сменил, после сменяме
        storeDataConfigMessage(session, CONFIG_MESSAGES._CONFIG_CONNECTION_DB);

        // Записваме на диска в .env файла и рестартираме MySQL връзката
        db.saveConfigToDisk({ host, user, password, database });

        delete activeSessions[clientIp];
        console.log(`🧹 Автоматично изчистена стара сесия за IP: ${clientIp}`);

        // Връщаме отговор с флаг requiresLogin
        res.json({ 
            success: true, 
            message: 'Настройките са записани перманентно! Базата данни е променена. Моля, влезте наново.',
            requiresLogin: true 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API за извличане на системния лог с LEFT JOIN
app.get('/api/reports/system-log', (req, res) => {
    // Проверка за сигурност през нашето Middleware по IP адрес
    const clientIp = req.ip;
    const session = activeSessions[clientIp];
    if (!db.checkDbStatus()) return res.status(503).json({ error: 'Няма връзка с базата данни' });

    // Твоята класическа C++ SQL заявка
    const queryText = `
        SELECT accounts_system.id_pc, operators.name_operator, accounts_system.date_time, accounts_system.id_message 
        FROM accounts_system 
        LEFT JOIN operators USING(id_operator) 
        ORDER BY accounts_system.date_time
    `;

    const connection = db.getConn();
    connection.query(queryText, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });

        // Превеждаме id_message към твоите IDS_... текстове преди да ги пратим към HTML
        const formattedResults = results.map(row => {
            const dateObj = new Date(row.date_time);
            return {
                id_pc: row.id_pc,
                name_operator: row.name_operator || 'Система', 
                date_time_raw: row.date_time, // ISO дата за Excel и ВЯРНО сортиране
                date_time_bg: dateObj.toLocaleString('bg-BG'), // Текст за екрана
                message_text: CONFIG_MESSAGES_TEXT[row.id_message] || CONFIG_MESSAGES_TEXT["UNKNOWN"]
            };
        });

        res.json(formattedResults);
    });
});

// Универсална функция за запис на системен лог в MySQL
function storeDataConfigMessage(session, typeConfig) {
    // Вземаме ID-то на оператора от сесията. Ако няма сесия, чак тогава е 0
    const idOperator = session ? session.id_operator : 0; 

    // ЖЕЛЯЗНАТА ПРОВЕРКА НА СТАРИЯ МАЙСТОР:
    // Проверяваме директно вътре в обекта на сесията дали събитието се повтаря последователно
    if (session && session.old_typeConfig === typeConfig) {
        console.log(`⏳ [ФИЛТЪР] Игнориран повтарящ се запис за събитие ${typeConfig} за Оператор №${idOperator}`);
        return; 
    }

    const idPC = 1; // Докато не направим station.html
    const connection = db.getConn();
    const queryText = 'INSERT INTO accounts_system(id_pc, id_operator, id_message, date_time) VALUES (?, ?, ?, NOW())';
    
    connection.query(queryText, [idPC, idOperator, typeConfig], (err, results) => {
        if (err) {
            console.error('🚨 Грешка при запис в accounts_system: ', err.message);
            return;
        }
        
        // СЛЕД УСПЕШЕН ЗАПИС: Записваме в паметта на текущата сесия предходното събитие
        if (session) {
            session.old_typeConfig = typeConfig;
        }
        console.log(`💾 [УСПЕШЕН ЛОГ] Записано събитие ${typeConfig} за Оператор №${idOperator}`);
    });
}

app.listen(APP_PORT, () => {
    console.log(`Сървърът StreetLightsMasterHtml (Tutor) стартира на http://localhost:${APP_PORT}`);
});
