const axios = require("axios");
const bullLogging = require('./bull_logging.js');

module.exports = async (job, done) => {
    try {
        const { bullLog, loggerOptions, action, jobData, baseURL } = job.data;
        job = { ...job, ...jobData };

        const bc_logger = bullLogging.setupWinston(loggerOptions.console_logging, loggerOptions.file_logging, "BullQAPIJob");

        const apiURL = baseURL + action;

        bc_logger.debug(`Processing job ${job.id} with API URL: ${apiURL}`);

        if (bullLog) {
            await job.log(`Processing job ${job.id} with API URL: ${apiURL}`)
        }

        bc_logger.debug(`Sending POST request to API URL: ${apiURL} with data: `, job);

        if (bullLog) {
            await job.log(`Sending POST request to API URL: ${apiURL} with data: ${JSON.stringify(job)}`)
        }

        axios
            .post(apiURL, job, { timeout: 120000 })
            .then((response) => {

                bc_logger.debug(`Job ${job.id} API response: `, response.data);
                bc_logger.info(`Job ${job.id} completed successfully`);
                if (bullLog) {
                    job.log(`Job ${job.id} completed successfully. Response: ${JSON.stringify(response.data)}`)
                }
                done()


            })
            .catch((err) => {

                bc_logger.error(`Job ${job.id} failed with error: ${err.message}`);

                if (bullLog) {
                    job.log(`Job ${job.id} failed with error: ${err.message}`)
                }

                done(err);


            });
    } catch (error) {
        bc_logger.error(`Job ${job.id} failed with error: ${error.message}`);

        if (bullLog) {
            await job.log(`Job ${job.id} failed with error: ${error.message}`)
        }

        done(error);
    }
};