const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const axios = require('axios');
const { exec } = require('child_process');
const path = require('path');

// Вставьте ваш токен бота
const token = '7305679199:AAGZyy9VTYRMdmccXnejIvPebaAtVvCgr1M';
const bot = new TelegramBot(token, { polling: true });

// Путь к скрипту Python
const pythonScript = 'python3 main.py';

// Функция для создания уникального имени файла
function generateUniqueFilename(userId) {
    const timestamp = Date.now();  // Время в миллисекундах для уникальности
    return `${userId}_${timestamp}`;
}

// Запуск бота
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Пожалуйста, отправьте голосовое сообщение.");
});

// Обработка голосовых сообщений
bot.on('voice', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Генерируем уникальное имя файла для каждого пользователя
    const uniqueFilename = generateUniqueFilename(userId);
    const oggFilePath = `./audio/${uniqueFilename}.ogg`; // путь для сохранения ogg
    const wavFilePath = `./audio/${uniqueFilename}.wav`;

    // Скачиваем голосовое сообщение в формате Ogg
    const fileId = msg.voice.file_id;
    const fileUrl = await bot.getFileLink(fileId);
    
    const response = await axios.get(fileUrl, { responseType: 'stream' });
    const writeStream = fs.createWriteStream(oggFilePath);

    response.data.pipe(writeStream);

    writeStream.on('finish', () => {
        // Конвертируем и расшифровываем голосовое сообщение
        exec(`${pythonScript} ${oggFilePath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Ошибка при выполнении Python-скрипта: ${error.message}`);
                bot.sendMessage(chatId, "Произошла ошибка при обработке голосового сообщения.");
                return;
            }

            if (stderr) {
                console.error(`Ошибка: ${stderr}`);
            }

            const recognizedText = stdout.trim();
            bot.sendMessage(chatId, `Распознанный текст: ${recognizedText}`);

            // Удаляем временные файлы после обработки
            fs.unlink(oggFilePath, (err) => {
                if (err) console.error(`Ошибка удаления Ogg файла: ${err.message}`);
            });
            fs.unlink(wavFilePath, (err) => {
                if (err) console.error(`Ошибка удаления Wav файла: ${err.message}`);
            });
        });
    });
});
