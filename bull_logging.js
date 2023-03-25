// JavaScript Document

module.exports = {
    setupWinston: function setupWinston(console_logging, file_logging, category) {
        const { format, createLogger, transports } = require("winston");
        const { combine, timestamp, label, printf, prettyPrint, json, simple, align, logstash, padLevels, splat, colorize } = format;
        const dateTime = new Date().toISOString();
        const myFormat = printf(({ level, message, ...metadata }) => {
            return `${dateTime} ${level}: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata, null, 4) + '\n' : ''}`;

        });

        require('winston-daily-rotate-file');

        var logTransports = [];
        console_logging = console_logging || 'error';
        file_logging = file_logging || 'none';

        logTransports.push(new transports.Console(
            {
                level: console_logging,
                format: combine(

                    label({ label: category, message: true }),
                    padLevels(),
                    colorize(),
                    myFormat,

                ),
            }));


        if (file_logging != 'none') {

            logTransports.push(
                new transports.DailyRotateFile({
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

        return logger = createLogger({

            transports: logTransports

        });


    }

}