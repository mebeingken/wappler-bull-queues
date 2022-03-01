// JavaScript Document

const fs = require('fs-extra');
const App = require('../../../lib/core/app');

module.exports = async (job, done) => {
    job = {
        ...job, ...job.data.jobData
    }
    Object.assign(job, job.data.jobData);

    const app = new App({ params: job, session: {}, cookies: {}, signedCookies: {}, query: {}, headers: {} });
    const action = await fs.readJSON(`app/modules/lib/${job.data.action}.json`);

    app.define(action, true)
        .then(() => {
            done();
        }).catch((err) => {
            console.log(err);
            done(err)
        });

}