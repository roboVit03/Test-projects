const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "server.log");

if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, "=== Логи сервера ===\n", "utf8");
}

/**
 * Логування подій
 * @param {string} message - текст повідомлення
 * @param {string} type - тип події (INFO, СЕРВЕР, АВТОРИЗАЦІЯ, БАЗА ДАНИХ, API)
 */
function logEvent(message, type = "INFO") {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${type}: ${message}\n`;
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) console.error("Не вдалося записати лог:", err);
    });
}

module.exports = { logEvent };
