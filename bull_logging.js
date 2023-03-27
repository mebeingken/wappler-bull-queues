// JavaScript Document
const { format, createLogger, transports } = require("winston");
const { combine, timestamp, label, printf, colorize, padLevels } = format;
const DailyRotateFile = require("winston-daily-rotate-file");

const myFormat = printf(({ level, message, ...metadata }) => {
    const dateTime = new Date().toISOString();
    return `${dateTime} ${level}: ${message} ${Object.keys(metadata).length
        ? JSON.stringify(metadata, null, 4) + "\n"
        : ""
        }`;
});

module.exports = {
    setupWinston: function (
        console_logging = "error",
        file_logging = "none",
        category
    ) {
        let logTransports = [
            new transports.Console({
                level: console_logging,
                format: combine(
                    label({ label: category, message: true }),
                    padLevels(),
                    colorize(),
                    myFormat
                ),
            }),
        ];

        if (file_logging !== "none") {
            logTransports.push(
                new DailyRotateFile({
                    level: file_logging,
                    filename: "logs/bull-queue-%DATE%.log",
                    datePattern: "YYYY-MM-DD",
                    maxFiles: "14d",
                    format: combine(
                        label({ label: category, message: true }),
                        padLevels(),
                        myFormat
                    ),
                })
            );
        }

        return createLogger({
            transports: logTransports,
        });
    },
};