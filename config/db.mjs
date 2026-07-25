import mysql from 'mysql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import iconv from 'iconv-lite';

dotenv.config();

let dbConfig = {
    host     : process.env.DB_HOST || '127.0.0.1',
    user     : process.env.DB_USER || 'root',
    password : process.env.DB_PASS || '', 
    database : process.env.DB_NAME || 'StreetLights',
    // charset  : 'cp1251', // това не ми помогна, помогна долния ред в едната посока, а в другата toHex(...)
    // УМЕН ГЛОБАЛЕН ФИЛТЪР: Извлича суровите байтове и автоматично ги превежда в UTF-8 стринг
    typeCast: function (field, next) {
        if (field.type === 'VAR_STRING' || field.type === 'STRING' || field.type === 'BLOB') {
            const buf = field.buffer();
            if (buf) {
                // Използваме глобалния TextDecoder, за да върнем нормален JavaScript стринг
                let win1251 = new TextDecoder('windows-1251').decode(buf);
                // console.log(`field.name  ${field.name}`);
                // console.log(`field.type  ${field.type}`);
                // console.log(`win1251  ${win1251}`); 
                return win1251;
            }
            return '';
        }
        return next();
    }
};

let connection;
let isOnline = false; // Тук пазим текущия статус на връзката

export function connectDB() {
    // Ако вече има отворена връзка, я затваряме преди новия опит
    if (connection) {
        connection.end();
    }

    connection = mysql.createConnection(dbConfig);
    
    connection.connect((err) => {
        if (err) {
            console.error('⚠️ MySQL не отговаря: ' + err.message);
            isOnline = false;
        } else {
            console.log('✅ Успешно свързване с MySQL! ID: ' + connection.threadId);
            isOnline = true;
        }
    });
}

// Стартираме първоначалния опит при пускане на сървъра
connectDB();

export function getConn() { return connection; }
export function checkDbStatus() { return isOnline; } // Даваме статус на сървъра

export function updateConfigInMemory(newConfig) {
    dbConfig = { ...dbConfig, ...newConfig };
    connectDB(); // Пробваме новата връзка веднага
}

export function saveConfigToDisk(newConfig) {
    dbConfig = { ...dbConfig, ...newConfig };
    connectDB();

    const envContent = `DB_HOST=${dbConfig.host}\nDB_USER=${dbConfig.user}\nDB_PASS=${dbConfig.password}\nDB_NAME=${dbConfig.database}`;
    const envPath = path.resolve(process.cwd(), '.env');
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('💾 Настройките са записани в .env файла!');
}

export function getCurrentConfig() {
    return {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database
    };
}

// за работа със стария MySQL от 2000г., това е за текст на кирилица от http към MySQL 'cp1251'
export const toHex = (str) => '0x' + iconv.encode(str, 'win1251').toString('hex');
