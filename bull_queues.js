// JavaScript Document
// Ken Truesdale - ken@uniqueideas.com

const { toSystemPath } = require('../../../lib/core/path');
const Queue = require('bull');
const config = require('../../../lib/setup/config');

const redisReady = global.redisClient.ready;

const defaultConcurrency = 5;
const defaultQueueOptions = {
    redis: {
        port: global.redisClient.connection_options.port,
        host: global.redisClient.connection_options.host,
        db: 2
    }
}

var bullQueues = [];
var workerCounts = [];
var processorTypes = [];

var responseMessages = {};
responseMessages['noredis'] = { "response": 'Queue NOT created -- No Redis connection.' };
responseMessages['noqueue'] = { "response": 'Queue does not exist.' };

function setupQueue(queueName) {
    if (!bullQueues[queueName]) {
        var queueOptions = defaultQueueOptions;
        bullQueues[queueName] = new Queue(queueName, queueOptions);

    };
}

exports.create_queue = async function (options) {

    if (redisReady) {
        let processor_type = this.parseOptional(options.processor_type, 'string', 'library');
        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');
        let queueOptions = defaultQueueOptions;
        let concurrent_jobs = defaultConcurrency;
        let processorPath = toSystemPath('/extensions/server_connect/modules/bull_processor.js');
        let limit_type = this.parseOptional(options.limit_type, '*', 'concurrency');

        if (processor_type == 'api') {
            processorPath = toSystemPath('/extensions/server_connect/modules/bull_processor_api.js');
        }

        if (limit_type == 'limiter') {

            let max_jobs = parseInt(this.parseOptional(options.max_jobs, '*', null));
            let max_duration = parseInt(this.parseOptional(options.max_duration, '*', null));

            if (max_duration && max_jobs) {
                queueOptions = {
                    ...queueOptions, limiter: {
                        max: max_jobs,
                        duration: max_duration
                    }
                }

            };
        }

        concurrent_jobs = parseInt(this.parseOptional(options.concurrent_jobs, '*', defaultConcurrency));

        if (!concurrent_jobs > 0) {
            concurrent_jobs = defaultConcurrency;
        }

        if (!workerCounts[queueName]) {

            if (bullQueues[queueName]) {
                await bullQueues[queueName].close().catch(console.error);
                bullQueues[queueName] = null;
            }
            bullQueues[queueName] = new Queue(queueName, queueOptions);

            processorTypes[queueName] = processor_type;
            workerCounts[queueName] = concurrent_jobs;
            bullQueues[queueName].process(concurrent_jobs, processorPath);

            let jobscount = await bullQueues[queueName].getJobCounts().catch(console.error);

            if (jobscount) {

                return { "response": 'Queue ' + queueName + ' created' };
            } else {
                return {
                    "response": 'Queue ' + queueName + ' NOT created'
                };
            }
        } else {
            return { "response": 'Queue ' + queueName + ' NOT created -- it already exists.' };
        }

    } else {
        return responseMessages.noredis;
    }


};

exports.destroy_queue = async function (options) {


    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');

        if (!bullQueues[queueName]) {
            let queueOptions = defaultQueueOptions;
            bullQueues[queueName] = new Queue(queueName, queueOptions);

        };

        await bullQueues[queueName].obliterate({ force: true });
        await bullQueues[queueName].close().catch(console.error);

        bullQueues[queueName] = null;
        processorTypes[queueName] = null;
        workerCounts[queueName] = null;

        return { "response": 'Queue ' + queueName + ' destroyed.' };

    } else {

        return responseMessages.noredis;
    }
};

exports.queue_status = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');

        setupQueue(queueName);

        if (bullQueues[queueName]) {

            let jobscount = await bullQueues[queueName].getJobCounts().catch(console.error);
            let workers_attached = false;


            if (workerCounts[queueName]) {
                workers_attached = true;
            }

            return {
                "jobs_count": jobscount,
                "queue": queueName,
                "limiter": bullQueues[queueName].limiter || false,
                "workers_attached": workers_attached,
                "worker_count": workerCounts[queueName],
                "worker_type": processorTypes[queueName]
            };
        } else {
            return responseMessages['noqueue']
        }

    } else {

        return responseMessages.noredis;
    }
};

exports.queue_clean = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');
        let job_status = this.parseOptional(options.job_status, 'string', '');

        let grace_period = this.parseOptional(options.grace_period, 'number', 0);
        setupQueue(queueName);

        if (bullQueues[queueName]) {


            let cleaned = await bullQueues[queueName].clean(grace_period, job_status).catch(console.error);


            return { "jobs_removed": cleaned };
        } else {
            return responseMessages['noqueue']
        }

    } else {

        return responseMessages.noredis;
    }
};

exports.queue_pause = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');
        setupQueue(queueName);

        if (bullQueues[queueName]) {

            let pauseQueue = await bullQueues[queueName].pause({ isLocal: false, doNotWaitActive: true }).catch(console.error);

            return { "response": pauseQueue };
        } else {
            return responseMessages['noqueue']

        }

    } else {

        return responseMessages.noredis;
    }
};

exports.queue_resume = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');
        setupQueue(queueName);

        if (bullQueues[queueName]) {

            let resumeQueue = await bullQueues[queueName].resume({ isLocal: false }).catch(console.error);


            return { "response": resumeQueue };
        } else {
            return responseMessages['noqueue']
        }

    } else {

        return responseMessages.noredis;
    }
};
exports.get_jobs = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');

        setupQueue(queueName);

        if (bullQueues[queueName]) {

            let job_status = this.parseRequired(options.job_status, 'string', 'parameter job_status is required.');

            let jobs = null;

            switch (job_status) {
                case 'failed':
                    jobs = await bullQueues[queueName].getFailed().catch(console.error);
                    break;
                case 'completed':
                    jobs = await bullQueues[queueName].getCompleted().catch(console.error);
                    break;
                case 'delayed':
                    jobs = await bullQueues[queueName].getDelayed().catch(console.error);
                    break;
                case 'waiting':
                    jobs = await bullQueues[queueName].getWaiting().catch(console.error);
                    break;
                case 'active':
                    jobs = await bullQueues[queueName].getActive().catch(console.error);
                    break;
                default:
                // code block
            }



            return { "jobs": jobs };
        } else {
            return responseMessages['noqueue']
        }

    } else {

        return responseMessages.noredis;
    }
};
exports.retry_job = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');

        setupQueue(queueName);

        if (bullQueues[queueName]) {


            let job_id = this.parseRequired(options.job_id, 'string', 'parameter job id is required.');
            let job = await bullQueues[queueName].getJob(job_id);

            if (job) {

                job_state = await job.retry();
                return { "response": 'queued for retry' };

            } else {

                job_state = 'Job not found';
                return { "response": job_state };
            }


        }
        else {
            return responseMessages['noqueue'];
        }

    } else {

        return responseMessages.noredis;
    }
};
exports.job_state = async function (options) {
    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');

        setupQueue(queueName);

        if (bullQueues[queueName]) {


            let job_id = this.parseRequired(options.job_id, 'string', 'parameter job id is required.');
            let job = await jobState.getJob(job_id);

            if (job) {

                job_state = await job.getState();

            } else {

                job_state = 'Job not found'

            }

            return { "job": job, "job_state": job_state };
        }
        else {
            return responseMessages['noqueue']
        }

    } else {

        return responseMessages.noredis;
    }
};


exports.add_job = async function (options) {

    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');
        let remove_on_complete = this.parseOptional(options.remove_on_complete, 'boolean', false);
        let attempts = parseInt(this.parseOptional(options.attempts, '*', 1));

        setupQueue(queueName);

        let libraryFile = this.parseRequired(options.library_file, 'string', 'parameter library_file is required.');
        let delay_ms = parseInt(this.parseOptional(options.delay_ms, '*', 0));


        try {
            var myRegexp = /(?<=lib\/).*/;
            var libraryName = myRegexp.exec(libraryFile)[0].replace('.json', '');

        } catch (error) {

            return { "error": "You must select a file from this project's app/modules/lib folder (or its children)" };
        }

        var jobData = this.parse(options.bindings) || {}


        if (processorTypes[queueName] == 'library' || !workerCounts[queueName]) {
            const job = await bullQueues[queueName].add(
                {

                    jobData: jobData,
                    action: libraryName
                },
                {
                    delay: delay_ms,
                    removeOnComplete: remove_on_complete,
                    attempts: attempts
                }
            ).catch(console.error);

            return { "job_id": job.id, "queue": queueName };
        } else {
            return {
                "response": 'Queue ' + queueName + ' is not setup for Library processing.'
            };
        }



    } else {
        return responseMessages.noredis;
    }
};

exports.add_job_api = async function (options) {

    if (redisReady) {

        let queueName = this.parseRequired(options.queue_name, 'string', 'Queue name is required');
        let remove_on_complete = this.parseOptional(options.remove_on_complete, 'boolean', false);
        let attempts = parseInt(this.parseOptional(options.attempts, '*', 1));

        setupQueue(queueName);

        if (bullQueues[queueName]) {
            let apiFile = this.parseRequired(options.api_file, 'string', 'parameter api_file is required.');
            let delay_ms = parseInt(this.parseOptional(options.delay_ms, '*', 0));

            let base_url = this.global.data.$_SERVER.REQUEST_PROTOCOL + '://' + this.global.data.$_SERVER.SERVER_NAME + '/api/';
            if (this.global.data.$_SERVER.SERVER_NAME.includes('localhost')) {
                base_url = 'http://localhost:' + config.port + '/api/';
            }

            try {
                var myRegexp = /(?<=api\/).*/;
                var apiName = myRegexp.exec(apiFile)[0].replace('.json', '');

            } catch (error) {

                return { "error": "You must select a file from this project's app/api folder (or its children)" };
            }

            var jobData = this.parse(options.bindings) || {}

            if (processorTypes[queueName] == 'api' || !workerCounts[queueName]) {
                const job = await bullQueues[queueName].add(
                    {

                        jobData: jobData,
                        action: apiName,
                        baseURL: base_url
                    },
                    {
                        delay: delay_ms,
                        removeOnComplete: remove_on_complete,
                        attempts: attempts
                    }
                ).catch(console.error);

                return { "job_id": job.id, "queue": queueName };
            } else {
                return {
                    "response": 'Queue ' + queueName + ' is not setup for API processing.'
                };
            }


        } else {
            return responseMessages['noqueue']
        }
    } else {
        return responseMessages.noredis;
    }
};