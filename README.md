## ICG Task Service Manager

The ICG Task Service Manager provided a mechanism to manager services based upon an underlying task queueing system.  The service manager will call the worker jobs when a new item in available for processing in the queue.

### Required Configuration

The following configuration elements are required:

    config: {
      apiBaseUrl: "http://localhost:3000",
      sessionPath: "ap/sessions",
      credentials: {
        user: "USER"
        password: "SECRET"
      }
      jobs: [...]
    }


### Job Configuration


    config: {
      jobs: [
        task:"email.notification",
        job: {
          name:"email.notification",
          script: "./job-notification"
        }
      ]
    }


### Workers

Workers are exported functions that accept 3 parameters, job options, a config object and a callback.  Note:  Workers must call the callback or subsequent runs will be aborted.  This is to prevent two jobs from overlapping.
