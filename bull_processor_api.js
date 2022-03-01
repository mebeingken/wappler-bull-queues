// JavaScript Document
const axios = require('axios');
const App = require('../../../lib/core/app');


module.exports = async (job, done) => {
    job = {
        ...job, ...job.data.jobData
    }

    let apiURL = job.data.baseURL + job.data.action;

    axios.post(apiURL, job)
        .then(() => {
            done();
        }).catch((err) => {
            done(err)
        });

}