import mysql from 'mysql';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

let dbConfig = {
    host     : process.env.DB_HOST || '127.0.0.1',
    user     : process.env.DB_USER || 'root',
    password : process.env.DB_PASS || '', 
    database : process.env.DB_NAME || 'StreetLights',
    charset  : 'cp1251'
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

