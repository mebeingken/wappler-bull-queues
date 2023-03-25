// JavaScript Document
const bullLogging = require('./bull_logging.js');
const fs = require('fs-extra');
const App = require('../../../lib/core/app');

module.exports = async (job, done) => {
    job = {
        ...job, ...job.data.jobData
    }

    const bullLog = job.data.bullLog;

    Object.assign(job, job.data.jobData);

    const loggerOptions = job.data.loggerOptions;
    const logger = bullLogging.setupWinston(loggerOptions.console_logging, loggerOptions.file_logging, "Bull-Process library job");

    logger.debug(`Processing job ${job.id} with library: ${job.data.action}`);

    bullLog ? await job.log(`Processing job ${job.id} with library: ${job.data.action}`) : null;

    bullLog ? await job.log(`Sending request to library: ${job.data.action} with data: ${JSON.stringify(job)}`) : null;

    const app = new App({ params: job, session: {}, cookies: {}, signedCookies: {}, query: {}, headers: {} });
    const action = await fs.readJSON(`app/modules/lib/${job.data.action}.json`);

    app.define(action, true)
        .then(() => {
            logger.info(`Job ${job.id} completed successfully`);
            done();
        }).catch((err) => {
            logger.error(`Job ${job.id} failed with error: ${err.message}`);
            done(err)
        });

}