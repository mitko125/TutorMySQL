import mysql from 'mysql';

// Начална конфигурация по подразбиране
let dbConfig = {
  host     : '127.0.0.1',
  user     : 'root',
  password : '', 
  database : 'StreetLightsTest',
  charset  : 'cp1251' // Ето го спасението за кирилицата от 2000 година!
};

let connection = mysql.createConnection(dbConfig);

function connectDB() {
  connection.connect((err) => {
    if (err) {
      console.error('Грешка при свързване с MySQL: ' + err.stack);
    } else {
      console.log('Успешно свързване! ID: ' + connection.threadId);
    }
  });
}

connectDB();

// Експортираме функциите директно чрез ESM синтаксис
export const getConn = () => connection;

export const updateConfig = (newConfig) => {
  connection.end(); // Затваряме старата
  dbConfig = { ...dbConfig, ...newConfig };
  connection = mysql.createConnection(dbConfig); // Създаваме нова в паметта
  connectDB();
};
