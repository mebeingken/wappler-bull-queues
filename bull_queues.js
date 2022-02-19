// JavaScript Document
const { toSystemPath } = require('../../../lib/core/path');
const Queue = require('bull');

let bullQueues = {};

const redisReady = global.redisClient.ready;
const processorPath = toSystemPath('/extensions/server_connect/modules/bull_processor.js');
let responseMessages = {};
responseMessages['noredis'] = { "response": 'Queue NOT created -- No Redis connection' };

let queueOptions = {
    redis: {
        port: global.redisClient.connection_options.port, host: global.redisClient.connection_options.host
    }
}

function setup_queue(queueName) {

    if (!bullQueues[queueName]) {

        bullQueues[queueName] = new Queue(queueName, queueOptions);

        bullQueues[queueName].process(5, processorPath);
    }

}

function getQueueNames(obj, options) {

    let queueDisplayName = obj.parseRequired(options.queue_name, 'string', 'Queue name is required'),
        queueName = 'bull-q-' + queueDisplayName;

    return { queueDisplayName, queueName };

}

exports.create_queue = async function (options) {

    if (redisReady) {

        let { queueDisplayName, queueName } = getQueueNames(this, options);

        if (!bullQueues[queueName]) {

            let concurrent_jobs = this.parseOptional(options.concurrent_jobs, 'number', 5);
            let max_jobs = this.parseOptional(options.max_jobs, 'number', '');
            let max_duration = this.parseOptional(options.max_duration, 'number', '');

            if (max_duration != '' & max_jobs != '') {

                Object.assign(queueOptions, {
                    limiter: {
                        max: max_jobs,
                        duration: max_duration
                    }
                });

            }

            bullQueues[queueName] = new Queue(queueName, queueOptions);

            bullQueues[queueName].process(concurrent_jobs, processorPath);

            let jobscount = await bullQueues[queueName].getJobCounts().catch(console.error);

            if (jobscount) {
                return { "response": 'Queue ' + queueDisplayName + ' created' };
            } else {
                return {
                    "response": 'Queue ' + queueDisplayName + ' NOT created'
                };
            }

        } else {
            return { "response": 'Queue ' + queueDisplayName + ' NOT created -- it already exists' };
        }
    } else {
        return responseMessages.noredis;
    }


};

exports.destroy_queue = async function (options) {

    if (redisReady) {

        let { queueDisplayName, queueName } = getQueueNames(this, options);

        bullQueues[queueName] = new Queue(queueName, queueOptions);

        bullQueues[queueName].obliterate({ force: true });
        bullQueues[queueName] = null;

        return { "response": 'Queue ' + queueDisplayName + ' destroyed.' };

    } else {

        return responseMessages.noredis;
    }
};

exports.queue_status = async function (options) {
    if (redisReady) {

        let { queueDisplayName, queueName } = getQueueNames(this, options);

        if (bullQueues[queueName]) {

            let jobscount = await bullQueues[queueName].getJobCounts().catch(console.error);
            Object.assign(jobscount, { "queue": queueDisplayName })

            return { "jobs_count": jobscount };

        } else {

            return { "response": 'Queue ' + queueDisplayName + ' does not exist.' };
        }
    } else {

        return responseMessages.noredis;
    }
};

exports.job_state = async function (options) {
    if (redisReady) {

        let { queueDisplayName, queueName } = getQueueNames(this, options);

        if (bullQueues[queueName]) {
            let job_id = this.parseRequired(options.job_id, 'string', 'parameter job id is required.');
            let job = await bullQueues[queueName].getJob(job_id);

            if (job) {

                job_state = await job.getState();

            } else {

                job_state = 'Job not found'

            }

            return { "job": job, "job_state": job_state };

        } else {

            return { "response": 'Queue ' + queueDisplayName + ' does not exist.' };
        }
    } else {

        return responseMessages.noredis;
    }
};


exports.add_job = async function (options) {

    if (redisReady) {

        let { queueDisplayName, queueName } = getQueueNames(this, options);
        let createQueue = this.parseOptional(options.create_queue, 'boolean', false);


        if (createQueue) {
            setup_queue(queueName);
        }

        if (bullQueues[queueName]) {
            let libraryFile = this.parseRequired(options.library_file, 'string', 'parameter library_file is required.');
            let delay_ms = options.delay_ms;


            try {
                var myRegexp = /(?<=lib\/).*/;
                var libraryName = myRegexp.exec(libraryFile)[0].replace('.json', '');

            } catch (error) {

                return { "error": "You must select a file from this project's app/modules/lib folder (or its children)" };
            }

            var jobData = this.parse(options.bindings) || {}

            const job = await bullQueues[queueName].add(
                {

                    jobData: jobData,
                    action: libraryName
                },
                {
                    delay: delay_ms
                }
            ).catch(console.error);

            return { "job_id": job.id, "queue": queueDisplayName };

        } else {
            return {
                "response": 'Queue ' + queueDisplayName + ' does not exist.'
            };
        }
    } else {
        return responseMessages.noredis;
    }
};

