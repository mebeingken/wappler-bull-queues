// JavaScript Document
const bullLogging = require('./bull_logging.js');
const fs = require('fs-extra');
const App = require('../../../lib/core/app');

module.exports = async (job, done) => {
    const { bullLog, loggerOptions, action, jobData } = job.data;
    job = { ...job, ...jobData };

    const logger = bullLogging.setupWinston(
        loggerOptions.console_logging,
        loggerOptions.file_logging,
        'BullQLibraryJob'
    );

    logger.debug(`Processing job ${job.id} with library: ${action}`);

    if (bullLog) {
        await job.log(`Processing job ${job.id} with library: ${action}`);
        await job.log(`Sending request to library: ${action} with data: ${JSON.stringify(job)}`);
    }

    const app = new App({ params: job, session: {}, cookies: {}, signedCookies: {}, query: {}, headers: {} });
    const actionFile = await fs.readJSON(`app/modules/lib/${action}.json`);

    app
        .define(actionFile, true)
        .then(() => {
            logger.info(`Job ${job.id} completed successfully`);
            done();
        })
        .catch((err) => {
            logger.error(`Job ${job.id} failed with error: ${err.message}`);
            done(err);
        });
};