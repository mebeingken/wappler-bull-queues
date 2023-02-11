const axios = require("axios");

module.exports = async(job, done) => {
    try {
        job = {
            ...job,
            ...job.data.jobData,
        };

        let apiURL = job.data.baseURL + job.data.action;

        axios
            .post(apiURL, job, { timeout: 120000 })
            .then(() => {
                done();
            })
            .catch((err) => {
                done(err);
            });
    } catch (error) {
        done(error);
    }
};