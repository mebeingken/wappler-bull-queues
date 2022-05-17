// JavaScript Document
const axios = require('axios');
//const App = require('../../../lib/core/app');


module.exports = async (job, done) => {
    try {
        job = {
            ...job, ...job.data.jobData
        }

        let apiURL = job.data.baseURL + job.data.action;

        axios.post(apiURL, job, { timeout: 120000 })
            .then(() => {
                done();
            }).catch((err) => {
                done(err)
            });

    } catch (error) {

    }

}