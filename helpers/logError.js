const fs = require('fs');
const path = require('path');

const logFilePath = path.join(__dirname, '../logs/error.log');

async function logError(error, info) {
    try {
        const errorMessage = `[${new Date().toISOString()}] ${error}\n${info}\n\n`;
        
        fs.appendFile(logFilePath, errorMessage, (err) => {
            if (err) {
                console.error('Failed to write to log file:', err);
            }
        });
    } catch (err) {
        console.error('Error while appending to log file:', err);
    }
}

module.exports = logError;