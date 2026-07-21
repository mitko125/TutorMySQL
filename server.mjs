import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { getConn, updateConfig } from './config/db.mjs';
import { codePassword, decodePassword } from './utils/crypto.mjs';

// Регенериране на __dirname, тъй като липсва в ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 8000;

// За да можем да четем JSON данни изпратени от HTML фронтенда
app.use(express.json());
// Споделяне на статичните HTML/CSS/JS файлове от папка "public"
app.use(express.static(path.join(__dirname, 'public')));

// Ендпойнт 1: Вземане на списък с оператори за падащото меню
app.get('/api/operators', (req, res) => {
    const db = getConn();
    db.query('SELECT id_operator, name_operator, privilege FROM operators', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Ендпойнт 2: Влизане в системата (Проверка на парола)
app.post('/api/login', (req, res) => {
    const { id_operator, password } = req.body;
    const db = getConn();
    
    db.query('SELECT * FROM operators WHERE id_operator = ?', [id_operator], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Няма такъв оператор' });
        
        const operator = results[0];
        // Декодираме паролата от базата данни
        const decryptedDbPassword = decodePassword(operator.password_operator);
        
        // Сравняваме я с въведената от потребителя
        if (decryptedDbPassword === password) {
            res.json({ success: true, privilege: operator.privilege, name: operator.name_operator });
        } else {
            res.json({ success: false, message: 'Грешна парола!' });
        }
    });
});

// Ендпойнт 3: Временна промяна на връзката към MySQL (Само в паметта на бакенда)
app.post('/api/config/test', (req, res) => {
    const { host, user, password, database } = req.body;
    try {
        updateConfig({ host, user, password, database });
        res.json({ success: true, message: 'Настройките са променени в паметта!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Сървърът StreetLightsMasterHtml (Tutor) стартира на http://localhost:${PORT}`);
});
