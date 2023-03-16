# Wappler Bull Queues

## Functionality
Allows for the creation of one to many queues to offload the execution of Wappler library tasks

## Requirements
* Functioning Redis connection, specified within the Wappler server config or a Redis connection defined with ENV variables

## Installation
* In your project folder, create /extensions/server_connect/modules (if it does not yet exist)
* Unzip the source code into /extensions/server_connect/modules (3 files)
* Refresh the Server Actions panel (restarting Wappler is also an option)
* The required libraries will be installed automatically upon use and next deployment
* You should now have a Bull Queues group in your available actions list for server workflows

## Optional ENV Variables
* REDIS_PORT: The Redis port
* REDIS_HOST: The Redis host
* REDIS_BULL_QUEUE_DB: The Redis database for bull queues
* REDIS_PASSWORD: The Redis password
* REDIS_USER: The Redis user
* REDIS_TLS: The TLS certificate. Define it is {} if you need a TLS connection without defining a cert.
* REDIS_PREFIX: The prefix for the database. This is useful if you need to connect to a clusert.
* REDIS_BULL_METRICS: Boolean. Enables Bull metrics collection which can be visualised with a GUI like https://taskforce.sh/
* REDIS_BULL_METRICS_TIME: The timeframe for metric collection. Defaults to TWO_WEEKS if metrics are enabled

## Actions
All actions require a queue name be provided

### Create Queue
* Creates a queue with optional parameters
* Responds with message indicating result

### Add Job
* Add a job into a queue
* The job will execute the specified Library File, pasing it the PARAM values provided
* The job id is also provided to the library and can be accessed using $_PARAM.id
* Optionally create a queue with the default set of parameters (see below)
* Optionally delay job x number of milliseconds (v 1.1.0)
* Optionally remove the job from the queue when completed (v 1.2.0)
* Responds with the job id
* NOTE: The Add Job action currently does not work if it is executed from a previously submitted job. In other words, if you are doing an iteration where you submit new jobs from a previously submitted job, it will fail. Use the Add Job API instead.

### Add Job API (v 1.2.0)
* Add a job into a queue
* The job will execute the specified API File, pasing it the POST values provided
* The job id is also provided to the library and can be accessed using $_POST.id
* Optionally create a queue with the default set of parameters (see below)
* Optionally delay job x number of milliseconds
* Optionally remove the job from the queue when completed
* Optionally remove the job from the queue when failed
* Responds with the job id

### Queue Status
* Returns the job counts for the specified queue (Active, completed, waiting, delayed, etc.)

### Queue Clean (v 1.2.0)
* Removes jobs from a queue by job status
* Optionally set grace period to retain newer jobs while deleting old
* Job status choices: Completed, Delayed, Failed (Active jobs cannot be removed, Waiting not support by Bull queue library)

### Job State
* Returns the job details for a given job id, along with the current status

### Get Jobs (v 1.2.0)
* Retrieve jobs by job status from a specified queue
* Job choices: Active, Failed, Waiting, Delayed, Completed

### Destroy Queue
* Forecably destroys a given queue
* Removes any and all jobs from the queue (any jobs currently running will complete)
* Resets the job id back to 1

## Queue Parameters
* Queue name - Used to specify a unique queue and is used by actions to specify the queue
* Number of concurrent jobs - The number of jobs that can be run in parallel for this queue
* Max jobs - The maximum number of jobs to be run within a given duration
* Duration for max jobs - Number of milliseconds used when calculating max jobs
* The default parameters are 5 concurrent jobs, and no rate limiting (no max jobs, and no duration)

## Rate limiting
By using the max jobs and duration parameters for a queue, a queue can limit how quickly jobs are processed.  For example if the library uses an external api that limits usage to 1 request per second, the queue can be configured with Max jobs = 1, and Duration = 1000
