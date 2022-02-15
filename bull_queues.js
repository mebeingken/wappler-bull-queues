// JavaScript Document
const { toSystemPath } = require('../../../lib/core/path');


const Queue = require('bull');
let customQueue = null;

function setup_queue() {
    if (customQueue == null) {

        let processorPath = toSystemPath('/extensions/server_connect/modules/bull_processor.js');

        customQueue = new Queue('custom-queue', {
            redis: {
                port: global.redisClient.connection_options.port, host: global.redisClient.connection_options.host
            }
        });

        customQueue.process(5, processorPath);

    }
}


exports.create_queue = async function (options) {


    if (customQueue == null) {

        let processorPath = toSystemPath('/extensions/server_connect/modules/bull_processor.js');
        let concurrent_jobs = this.parseOptional(options.concurrent_jobs, 'number', 5);
        let max_jobs = this.parseOptional(options.max_jobs, 'number', '');
        let max_duration = this.parseOptional(options.max_duration, 'number', '');

        if (max_duration != '' & max_jobs != '') {
            customQueue = new Queue('custom-queue', {
                redis: {
                    port: global.redisClient.connection_options.port, host: global.redisClient.connection_options.host
                },
                limiter: {
                    max: max_jobs,
                    duration: max_duration
                }

            });
        } else {
            customQueue = new Queue('custom-queue', {
                redis: {
                    port: global.redisClient.connection_options.port, host: global.redisClient.connection_options.host
                }

            });
        }



        customQueue.process(concurrent_jobs, processorPath);

        let jobscount = await customQueue.getJobCounts().catch(console.error);
        if (jobscount) {
            return { "response": jobscount };
        } else {
            return { "response": 'Queue NOT created' };
        }
    } else {
        return { "response": 'Queue NOT created -- already exists' };
    }

};

exports.destroy_queue = async function (options) {



    setup_queue();

    customQueue.obliterate({ force: true });
    customQueue = null;
    return { "response": 'Queue destroyed.' };



};

exports.queue_status = async function (options) {



    setup_queue();

    let jobscount = await customQueue.getJobCounts().catch(console.error);
    return { "jobs_count": jobscount };



};

exports.job_state = async function (options) {


    setup_queue();

    let job_id = this.parseRequired(options.job_id, 'string', 'parameter job id is required.');

    let job = await customQueue.getJob(job_id);
    if (job) {
        job_state = await job.getState();
    } else {
        job_state = 'Job not found'
    }


    return { "job": job, "job_state": job_state };

};

exports.receive_job = async function (options) {

    setup_queue();


    return {
        "id": this.req.body.id, "timestamp": this.req.body.opts.timestamp, "attempts": this.req.body.opts.attempts, "delay": this.req.body.opts.delay, "data": this.req.body.data.jobData
    }


};

exports.add_job = async function (options) {


    setup_queue();

    let libraryFile = this.parseRequired(options.library_file, 'string', 'parameter library_file is required.');

    try {
        var myRegexp = /(?<=lib\/).*/;
        var libraryName = myRegexp.exec(libraryFile)[0].replace('.json', '');
    } catch (error) {
        return { "error": "You must select a file from this project's app/modules/lib folder (or its children)" };
    }

    var jobData = this.parse(options.bindings) || {}

    const job = await customQueue.add({

        jobData: jobData,
        action: libraryName
    });

    return { "job_id": job.id };

};

