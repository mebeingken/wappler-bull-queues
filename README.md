# Wappler Bull Queues

## Functionality
Allows for the creation of one to many queues to offload the execution of Wappler library tasks

## Requirements
* Functioning Redis connection, specified within the Wappler server config

## Installation
* In your project folder, create /extensions/server_connect/modules (if it does not yet exist)
* Unzip the source code into /extensions/server_connect/modules (3 files)
* Refresh the Server Actions panel (restarting Wappler is also an option)
* The required libraries will be installed automatically upon use
* You should now have a Bull Queues group in your available actions list for server workflows

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
* Responds with the job id

### Queue Status
* Returns the job counts for the specified queue (Active, completed, waiting, delayed, etc.)

### Job State
* Returns the job details for a given job id, along with the current status

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
