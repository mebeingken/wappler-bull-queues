const axios = require("axios");

module.exports = async(job, done) => {
    try {
        job = {
            ...job,
            ...job.data.jobData,
        };

        const apiURL = job.data.baseURL + job.data.action;

        console.log(`Processing job ${job.id} with API URL: ${apiURL}`);

        await job.log(`Processing job ${job.id} with API URL: ${apiURL}`);

        console.log(`Sending POST request to API URL: ${apiURL} with data: `, job);

        await job.log(`Sending POST request to API URL: ${apiURL} with data: ${JSON.stringify(job)}`);

        axios
            .post(apiURL, job, { timeout: 120000 })
            .then((response) => {
                console.log(`Job ${job.id} completed successfully`);

                job.log(`Job ${job.id} completed successfully. Response: ${JSON.stringify(response.data)}`)
                    .then(() => {
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            })
            .catch((err) => {
                console.log(`Job ${job.id} failed with error: ${err.message}`);

                job.log(`Job ${job.id} failed with error: ${err.message}`)
                    .then(() => {
                        done(err);
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
    } catch (error) {
        console.log(`Job ${job.id} failed with error: ${error.message}`);

        await job.log(`Job ${job.id} failed with error: ${error.message}`);

        done(error);
    }
};