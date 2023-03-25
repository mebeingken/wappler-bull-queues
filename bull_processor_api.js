const axios = require("axios");
const bullLogging = require('./bull_logging.js');

module.exports = async (job, done) => {
    try {
        job = {
            ...job,
            ...job.data.jobData,
        };

        const bullLog = job.data.bullLog;
        const loggerOptions = job.data.loggerOptions;

        const bc_logger = bullLogging.setupWinston(loggerOptions.console_logging, loggerOptions.file_logging, "BullQAPIJob");

        const apiURL = job.data.baseURL + job.data.action;

        bc_logger.debug(`Processing job ${job.id} with API URL: ${apiURL}`);

        bullLog ? await job.log(`Processing job ${job.id} with API URL: ${apiURL}`) : null;

        bc_logger.debug(`Sending POST request to API URL: ${apiURL} with data: `, job);

        bullLog ? await job.log(`Sending POST request to API URL: ${apiURL} with data: ${JSON.stringify(job)}`) : null;

        axios
            .post(apiURL, job, { timeout: 120000 })
            .then((response) => {

                bc_logger.debug(`Job ${job.id} API response: `, response.data);
                bc_logger.info(`Job ${job.id} completed successfully`);
                bullLog ? job.log(`Job ${job.id} completed successfully. Response: ${JSON.stringify(response.data)}`) : null
                done()


            })
            .catch((err) => {

                bc_logger.error(`Job ${job.id} failed with error: ${err.message}`);

                bullLog ? job.log(`Job ${job.id} failed with error: ${err.message}`) : null

                done(err);


            });
    } catch (error) {
        bc_logger.error(`Job ${job.id} failed with error: ${error.message}`);

        bullLog ? await job.log(`Job ${job.id} failed with error: ${error.message}`) : null;

        done(error);
    }
};