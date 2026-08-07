import { getConn } from '../config/db.mjs';

const HEADER_SIZE = 3;
const VERSION = 0;

const SOURCE_PORT = 0xD3ED;
const JENNIC_PORT = 0x0751;

const IPv6_PACKET = 2;

const CONFIG_DEFAULT_PREFIX_MSB = 0xfd040bd3;
const CONFIG_DEFAULT_PREFIX_LSB = 0x80e80000;

const sors = new Uint8Array([
    0xFD, 0x04, 0x0B, 0xD3, 0x80, 0xE8, 0xFF, 0xFF,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01
]);

const Get_request = 0x10; //Request to obtain the value of a variable
const Get_by_ID_request = 0x1C;	//Request to obtain the value of a variable in the module with specified ID
const Get_response = 0x11; //Response to a previous ‘Get’ or ‘Get by ID’ request
//‘Set’ request 0x12 Request to set the value of a variable
const Set_by_ID_request = 0x1D; //Request to set the value of a variable in the module with specified ID
const Set_response = 0x13; //Response to a previous ‘Set’ or ‘Set by ID’ request

const UNCNOW_ERROR = -1;
const NO_ROUTER = -5;
const NO_HARDWARE = -6;
const NO_CONNECT = -7;
const NO_OPEN = -8;
const NO_WRITE = -9;
const RECIVE_TIMEOUT = -10;
const NO_SOCKET = -11;

//0x00 8-bit signed integer
//0x01 16-bit signed integer
//0x02 32-bit signed integer
//0x03 64-bit signed integer
//0x04 8-bit unsigned integer
//0x05 16-bit unsigned integer
//0x06 32-bit unsigned integer
//0x07 64-bit unsigned integer
//0x08 32-bit IEEE 754 float
//0x09 64-bit IEEE 754 double
//0x0A Text string
//0x0B Binary blob
const BLOB_TABLE = 0x4B; //Blob table

const RECIVE_TIMEOUT_GetNeighbourTableBlobs = 10000;

export const runLQI = async (req, res) => {
    // Всичко от твоя готов софтуер си остава ЕДНО КЪМ ЕДНО тук:
    const { id_hardware } = req.body;
    
    let connection = getConn();

    // Извличаме IP адреса и главния MAC на избраната платка
    connection.query('SELECT number_hardware, MAC_address FROM hardwares WHERE id_hardware = ?', [id_hardware], async (err, rows) => {
        // Уловка: rows в mysql драйвера е масив, взимаме първия елемент rows[0]
        if (err || !rows || rows.length === 0) {
            return res.status(500).json({ success: false, message: 'Обектът не е намерен в базата данни!' });
        }

        const ip_address = rows[0].number_hardware; // например '192.168.1.79'
        const root_mac = rows[0].MAC_address;

        console.log(`📡 [LQI ТЕСТ] Стартирам разпит към ESP32 на адрес: http://${ip_address}`);

        let gridRows = [];

        // помощна за създаване на ред в таблицата
        function NewRown(num_line, depth, MAC_address, lamp_number) {
            let num_row = gridRows.length;
            let lampObj = {
                id: num_line.current,
                prev: {
                    id: lamp_number > 0 ? lamp_number : '',
                    mac: MAC_address
                },
                next: {
                    depth: depth
                }
            };
            gridRows.push(lampObj);
            num_line.current++;
            return num_row;
        }

        // Желязна рекурсивна функция с изчакване (await)
        async function TestLQI(num_line, depth, ip_address, Old_MAC_address, old_row, MAC_address, id_hardware, lamp_number) {
            const MAX_NEIGHBOUR_BLOBS = 10;
            let new_MAC_address = Array.from({ length: MAX_NEIGHBOUR_BLOBS }, () => new Uint8Array(16));
            let u8LQI = new Uint8Array(MAX_NEIGHBOUR_BLOBS);
            let u8PER = new Uint8Array(MAX_NEIGHBOUR_BLOBS);

            let u16FirstTableEntry = 0;
            let num_row = -1;
            let get_blobs;
            do {
                get_blobs = 0;
                let pu8Data = new Uint8Array(0);

                // Създаваме обекта-контейнер (това замества слагането на '&' пред променливата)
                let pu8DataRef = { current: pu8Data };

                let i16Lenght;
                let cou_error = 4;//2;//2;

                do {
                    const response = await GetNeighbourTableBlobs(ip_address, MAC_address, id_hardware, u16FirstTableEntry, MAX_NEIGHBOUR_BLOBS);

                    i16Lenght = response.bytesRead;
                    pu8DataRef.current = response.data; // Обновяваме контейнера-указател с точно отрязания подмасив!

                    cou_error--;
                } while ((i16Lenght == RECIVE_TIMEOUT) && (cou_error >= 0));

                pu8Data = pu8DataRef.current;

                switch (i16Lenght) {
                    case NO_ROUTER:
                        {
                            num_row = NewRown(num_line, depth - 1, MAC_address, lamp_number);
                            let lamp = gridRows[num_row];
                            lamp.next.mac = 'Няма рутер !';
                        }
                        return;
                    case NO_HARDWARE:
                        {
                            num_row = NewRown(num_line, depth - 1, MAC_address, lamp_number);
                            let lamp = gridRows[num_row];
                            lamp.next.mac = 'Няма хардуер !';
                        }
                        return;
                    case NO_CONNECT:
                        {
                            num_row = NewRown(num_line, depth - 1, MAC_address, lamp_number);
                            let lamp = gridRows[num_row];
                            lamp.next.mac = 'Не е свързана !';
                        }
                        return;
                    default:
                        if (i16Lenght < 0) {
                            num_row = NewRown(num_line, depth - 1, MAC_address, lamp_number);
                            let lamp = gridRows[num_row];
                            lamp.next.mac = 'Грешка';
                            return;
                        } else if (i16Lenght > 0) {
                            while (i16Lenght > 0) {
                                let EntryIndex = pu8Data[0] << 8 | pu8Data[1];
                                let BlowLenght = pu8Data[2];

                                // pu8Data += 3;
                                pu8Data = pu8Data.subarray(3);

                                if (BlowLenght === 10) {
                                    let macStr = "";

                                    pu8Data[0] ^= 0x02;
                                    for (let i = 0; i < 8; i++) {
                                        let byteVal = pu8Data[i];

                                        // 1. Горните 4 бита (data >>= 4;)
                                        let highNibble = byteVal >> 4;
                                        if (highNibble > 9) {
                                            macStr += String.fromCharCode('A'.charCodeAt(0) + highNibble - 10);
                                        } else {
                                            macStr += String.fromCharCode('0'.charCodeAt(0) + highNibble);
                                        }

                                        // 2. Долните 4 бита (data &= 0x0F;)
                                        let lowNibble = byteVal & 0x0F;
                                        if (lowNibble > 9) {
                                            macStr += String.fromCharCode('A'.charCodeAt(0) + lowNibble - 10);
                                        } else {
                                            macStr += String.fromCharCode('0'.charCodeAt(0) + lowNibble);
                                        }
                                    }
                                    new_MAC_address[get_blobs] = macStr;
                                    u8LQI[get_blobs] = pu8Data[8];
                                    u8PER[get_blobs] = pu8Data[9];

                                    // Инкрементиране на броячите
                                    u16FirstTableEntry++;
                                    get_blobs++;
                                }
                                pu8Data = pu8Data.subarray(BlowLenght);
                                i16Lenght -= 3 + BlowLenght;
                            }
                            let i;
                            for (i = 0; i < get_blobs; i++) {
                                if (new_MAC_address[i] == Old_MAC_address) {
                                    if (old_row >= 0) {
                                        let lamp = gridRows[old_row];
                                        lamp.prev.lqi = u8LQI[i];
                                        lamp.prev.per = u8PER[i];
                                    }
                                    break;
                                }
                            }
                            for (i = 0; i < get_blobs; i++) {
                                if (new_MAC_address[i] != Old_MAC_address) {
                                    const lampRows = await new Promise((resolve) => {
                                        const com = `SELECT id_lamp, street_name, street_number, last_contact, work_hours, last_test FROM lamps WHERE MAC_address = '${new_MAC_address[i]}'`;
                                        connection.query(com, (lampErr, results) => {
                                            if (lampErr) resolve(null);
                                            else resolve(results);
                                        });
                                    });

                                    // Ако лампата съществува в базата данни
                                    if (lampRows && lampRows.length > 0) {
                                        const lampData = lampRows[0]; // Взимаме първия намерен ред

                                        num_row = NewRown(num_line, depth, MAC_address, lamp_number);
                                        let lamp = gridRows[num_row];

                                        // Обновяваме lamp.next безопасно
                                        const dateObj1 = new Date(lampData.last_contact);
                                        const dateObj2 = new Date(lampData.last_test);
                                        lamp.next = {
                                            ...(lamp.next || {}), // Взима старите данни от next (ако ги има), ако ги няма - започва от празен обект
                                            id: lampData.id_lamp,
                                            mac: new_MAC_address[i],
                                            lqi: u8LQI[i],
                                            per: u8PER[i],
                                            street: lampData.street_name,
                                            street_number: lampData.street_number,
                                            LastContacts: dateObj1.toLocaleString('bg-BG'),
                                            work_hours: lampData.work_hours,
                                            LastTest: dateObj1.toLocaleString('bg-BG')
                                        };

                                        await TestLQI(num_line, depth + 1, ip_address, MAC_address, num_row, new_MAC_address[i], id_hardware, lampData.id_lamp);
                                    }
                                }
                            }
                        }
                        break;
                }
            } while ((get_blobs != 0) && (get_blobs == MAX_NEIGHBOUR_BLOBS));
        }

        // ИЗЧАКВАМЕ цялото дърво на mesh мрежата да се обходи докрай
        let num_line_ref = { current: 1 };
        await TestLQI(num_line_ref, 1, ip_address, '', -1, root_mac, id_hardware, -1);

        // Чак когато рекурсията е приключила на 100%, връщаме пълния масив с редове към браузъра!
        res.json({ success: true, rows: gridRows });
    });
};

function CreateIPv6Address(MAC_address, id_hardware)
{
    let addr = new Uint8Array(16);

    addr[0] = CONFIG_DEFAULT_PREFIX_MSB >> 24;
    addr[1] = (CONFIG_DEFAULT_PREFIX_MSB >> 16) & 0xFF;
    addr[2] = (CONFIG_DEFAULT_PREFIX_MSB >> 8) & 0xFF;
    addr[3] = CONFIG_DEFAULT_PREFIX_MSB & 0xFF;

    addr[4] = CONFIG_DEFAULT_PREFIX_LSB >> 24;
    addr[5] = (CONFIG_DEFAULT_PREFIX_LSB >> 16) & 0xFF;
    addr[6] = (id_hardware >> 8) & 0xFF;
    addr[7] = id_hardware & 0xFF;

    for (let i = 0; i < 8; i++) {
        let hexByte = MAC_address.substring(i * 2, (i * 2) + 2);
        addr[8 + i] = parseInt(hexByte, 16);
    }

    addr[8] ^= 0x02;

    return addr;
}

function CalculateChecsum(u32Length, pu8Data) {
    let checksum, lenght, data;

    // Проверяваме дали зададената дължина е нечетна
    let isOdd = (u32Length & 1) !== 0;
    if (isOdd) {
        u32Length++;
    }

    // Репродукция на оригиналната логика (първите присвоявания се пренаписват веднага)
    lenght = (pu8Data[4] << 8) | pu8Data[5];
    data = pu8Data[6];
    checksum = lenght + data;

    // Цикъл до лимита u32Length
    for (let i = 8; i < u32Length; i += 2) {
        let byte1 = pu8Data[i];
        let byte2 = pu8Data[i + 1];

        // Ако дължината е била нечетна и сме на последния байт, 
        // оригиналният код слага 0 (падинг) на pu8Data[u32Length - 1]
        // но тука сме само с образ на pu8Data и не променяма оригинала
        // добре че се оказа че не е важно
        if (isOdd && i === (u32Length - 2)) {
            byte2 = 0;
        }

        let currentData = (byte1 << 8) | (byte2 || 0);
        checksum += currentData;

        while (checksum >> 16) {
            checksum = (checksum & 0xFFFF) + (checksum >> 16);
        }
    }

    checksum = (~checksum) & 0xFFFF;
    return checksum;
}

export async function eJennicModuleSendMessageIPv6(ip_address, source_addr, dest_addr, u32Length, pu8Data, timeout = 0) {
    const buffer = new Uint8Array(500);
    let checksum;

    buffer[0] = 0x60;
    buffer[1] = 0;
    buffer[2] = 0;
    buffer[3] = 0;

    buffer[4] = ((u32Length + 8) >> 8) & 0xFF;
    buffer[5] = (u32Length + 8) & 0xFF;
    buffer[6] = 0x11;
    buffer[7] = 0x40;

    buffer.set(source_addr.subarray(0, 16), 8);
    buffer.set(dest_addr.subarray(0, 16), 24);

    buffer[40] = (SOURCE_PORT >> 8) & 0xFF;
    buffer[41] = SOURCE_PORT & 0xFF;
    buffer[42] = (JENNIC_PORT >> 8) & 0xFF;
    buffer[43] = JENNIC_PORT & 0xFF;

    buffer[44] = ((u32Length + 8) >> 8) & 0xFF;
    buffer[45] = (u32Length + 8) & 0xFF;
    buffer[46] = 0;
    buffer[47] = 0;

    buffer.set(pu8Data.subarray(0, u32Length), 48);

    u32Length += 40 + 8;
    checksum = CalculateChecsum(u32Length, pu8Data);

    buffer[46] = checksum >> 8;
    buffer[47] = checksum & 0xff;

    const test = new Uint8Array(500);
    test[0] = IPv6_PACKET;
    test.set(buffer.subarray(0, u32Length), 1);

    return SendReciv(ip_address, test, 1 + u32Length, 4, timeout);
}

async function SendReciv(ip_address, sendData, sendLenght, recivLenght, timeout = 10000) {
    const dwStart = Date.now();

    // Първо сглобяваме пълния пакет (Хедър + Данни), точно както го прави сокета
    const totalSendBytes = HEADER_SIZE + sendLenght;
    const localTxBuffer = new Uint8Array(totalSendBytes);
    localTxBuffer[0] = (sendLenght >> 8) & 0xFF;
    localTxBuffer[1] = sendLenght & 0xFF;
    localTxBuffer[2] = VERSION;
    if (sendData && sendLenght > 0) {
        localTxBuffer.set(sendData.subarray(0, sendLenght), HEADER_SIZE);
    }

    // Превръщаме този бинарен буфер в HEX ТЕКСТ (точно както го очаква твоето ESP32 в "send")
    let hexTextOut = "";
    for (let i = 0; i < totalSendBytes; i++) {
        let byte = localTxBuffer[i];
        hexTextOut += ((byte >> 4) & 0x0F).toString(16).toUpperCase();
        hexTextOut += (byte & 0x0F).toString(16).toUpperCase();
    }

    try {
        // Изстрелваме fetch заявката към новото ти RESTful API
        const url = `http://${ip_address}/api/v1/IPv6Jennic`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                send: hexTextOut,
                recivLenght: recivLenght,
                timeout: timeout
            }),
            signal: AbortSignal.timeout(timeout + 1000) // <--- Добавете това, за да прекрати по-рано, ако желаете
        });

        if (!response.ok) throw new Error(`HTTP грешка! Статус: ${response.status}`);
        
        const result = await response.json();

        if (result.status === "success" && result.reciv) {
            const cleanHex = result.reciv.trim();
            const totalBytesReceived = cleanHex.length / 2;
            const localRxBuffer = new Uint8Array(2051);

            // Декодираме текстовия HEX от "reciv" обратно в бинарен Uint8Array
            for (let i = 0; i < totalBytesReceived; i++) {
                let byteHigh = parseInt(cleanHex[i * 2], 16);
                let byteLow = parseInt(cleanHex[(i * 2) + 1], 16);
                localRxBuffer[i] = (byteHigh << 4) | byteLow;
            }

            // Извличаме дължината от декодирания хедър
            const bodyLengthExpected = (localRxBuffer[0] << 8) | localRxBuffer[1];
            const finalResultSize = HEADER_SIZE + bodyLengthExpected;

            const dwEnd = Date.now();
            // console.log(`🌐 [REST] Команда ${localTxBuffer[HEADER_SIZE]}: Получени ${finalResultSize} байта за ${dwEnd - dwStart}ms`);

            return { bytesRead: finalResultSize, data: localRxBuffer };
        }

    } catch (error) {
         // 1. Проверяваме дали грешката е нормален таймаут (от AbortSignal или от мрежата)
        const isTimeout = error.name === 'TimeoutError' || 
                          (error.cause && error.cause.code === 'UND_ERR_CONNECT_TIMEOUT');
                          
        // 2. Проверяваме дали ESP32 изобщо е отказал връзката (напр. грешен порт/забило)
        const isRefused = error.cause && error.cause.code === 'ECONNREFUSED';

        if (isTimeout || isRefused) {
            // Печатаме само ОДНО КРАТКО и чисто съобщение на един ред
            console.warn(`⚠️ [REST] ESP32 на адрес ${ip_address} не отговаря (Таймаут).`);
        } else {
            // Само ако се случи нещо съвсем различно и непознато, тогава извеждаме пълния дъмп
            console.error("❌ Критична грешка при REST SendReciv:", error);
        }
    }

    return { bytesRead: -1, data: new Uint8Array(0) };
}

// Готова функция за вземане на таблицата със съседите
async function GetNeighbourTableBlobs(ip_address, MAC_address, id_hardware, u16FirstTableEntry, u8EntryCount) {
    
    let lamp_address = CreateIPv6Address(MAC_address, id_hardware);

    let buffer = new Uint8Array(20);
    let mouleIndex = 0x01;
    let VariableIndex = 0x06;

    buffer[0] = VERSION;
    buffer[1] = Get_request;
    buffer[2] = Math.floor(Math.random() * 0x7FFFFFFF) & 0x7F;

    buffer[3] = mouleIndex;
    buffer[4] = VariableIndex;

    buffer[5] = (u16FirstTableEntry >> 8) & 0xFF;
    buffer[6] = (u16FirstTableEntry) & 0xFF;

    buffer[7] = u8EntryCount;
   
    // Извикваме горния PUT превод към ESP32
    const response = await eJennicModuleSendMessageIPv6(ip_address, sors, lamp_address, 8, buffer, RECIVE_TIMEOUT_GetNeighbourTableBlobs);
    
    // Дефинираме обекта по подразбиране, който ще върнем, ако има грешка или няма връзка
    let finalResponse = { bytesRead: NO_CONNECT, data: new Uint8Array(0) };

    if (response.bytesRead > 0) {
        // Използваме директно локалния масив response.data (който е дошъл от сокета)
        if (response.data[HEADER_SIZE] == IPv6_PACKET) {
            
            let pu8Data = response.data.subarray(HEADER_SIZE + 1);

            let checksum1 = pu8Data[46] << 8 | pu8Data[47];
            let i16Lenght = pu8Data[4] << 8 | pu8Data[5];
            let protocol = pu8Data[6];

            if (i16Lenght >= 19) {
                if (protocol == 17) {
                    if (pu8Data[49] == Get_response) {
                        if (pu8Data[53] == 0) {    // sucses
                            if (pu8Data[54] == BLOB_TABLE) {    // Blob table
                                let resultLenght = i16Lenght - 19;
                                pu8Data = pu8Data.subarray(40 + 19);
                                
                                // Сглобяваме обекта отговор с точната дължина и точно отрязания pu8Data подмасив
                                finalResponse = {
                                    bytesRead: resultLenght,
                                    data: pu8Data
                                };
                            }
                        }
                    }
                }
            }
        }
    }

    return finalResponse;
}
