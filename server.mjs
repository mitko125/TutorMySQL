import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './config/db.mjs';
import { codePassword, decodePassword } from './utils/crypto.mjs';
import { PRIVILEGE, APP_PORT } from './config/constants.mjs';

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
    
    // Проверяваме дали базата данни изобщо е онлайн
    const isDbOnline = db.checkDbStatus(); 

    // АКО БАЗАТА Е СЧУПЕНА: Позволяваме достъп САМО до db_config.html, за да се оправи връзката!
    if (!isDbOnline) {
        if (req.path === '/db_config.html') {
            return next(); // Пускаме го към конфигурационния файл без проверки за оператор
        } else {
            return res.redirect('/index.html?error=no_connection'); // Всичко друго се изхвърля
        }
    }

    // АКО БАЗАТА Е ОНЛАЙН: Изискваме потребителят изрично да е влязъл с ниво CONFIG (2)
    if (!session || session.privilege !== PRIVILEGE.CONFIG) {
        console.log(`🛡️ Middleware спря неоторизиран опит за разглеждане на: ${req.path} от IP: ${clientIp}`);
        return res.redirect('/index.html?error=no_rights'); // Изхвърляне към входа с грешка!
    }

    // Ако всичко е наред, викаме next(), което означава "Пътят е чист, дай му файла!"
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
            // ЖЕЛЯЗНА ЗАЩИТА: Записваме сесията в паметта на сървъра
            activeSessions[clientIp] = {
                name: operator.name_operator,
                privilege: operator.privilege // Записваме нивото (0, 1 или 2)
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

// Ендпойнт 3: Временна промяна на връзката към MySQL (Само в паметта на бакенда)
app.post('/api/config/test', (req, res) => {
    const { host, user, password, database } = req.body;
    try {
        db.updateConfigInMemory({ host, user, password, database });
        res.json({ success: true, message: 'Настройките са променени в паметта!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Обновяваме статус ендпоинта
app.get('/api/db-status', (req, res) => {
    res.json({ 
        online: db.checkDbStatus(),
        config: db.getCurrentConfig() // Пращаме текущите настройки към HTML-а
    });
});

// Ендпойнт за перманентно записване от Администратор
// При критична операция (Запис на диск) - Бакендът проверява ЖЕЛЕЗНО
app.post('/api/config/save', (req, res) => {
    const clientIp = req.ip;
    const session = activeSessions[clientIp];

    // Еквивалент на: if (privilege != CONFIG)
    if (!session || session.privilege !== PRIVILEGE.CONFIG) {
        console.log(`🚨 Опит за достъп без права от IP: ${clientIp}`);
        return res.status(403).json({ success: false, message: 'Нямате права!' });
    }

    // Ако проверката мине - чак тогава изпълняваме записа
    const { host, user, password, database } = req.body;
    try {
        db.saveConfigToDisk({ host, user, password, database });
        res.json({ success: true, message: 'Настройките бяха записани на ДИСКА!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(APP_PORT, () => {
    console.log(`Сървърът StreetLightsMasterHtml (Tutor) стартира на http://localhost:${APP_PORT}`);
});
