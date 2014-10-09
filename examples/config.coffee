path = require('path')

module.exports =
  serviceName: "icg-task-service"
  serviceDescription: "ICG Task Service"
  logPath: path.join(__dirname, "/logs/icg-task-service.log")
  logLevel: "debug"
  apiBaseUrl: "http://localhost:3000/api"
  sessionPath: "ap/sessions"
  taskPath: "ap/queuedTasks"
  deadWorkerProcessTimeout: "00:00:30" # 6 minutes
  credentials:
    user: "SYSADMIN"
    password: "SYSADMIN"
  jobs: [
    task: "email.test" # Once every fifteen seconds (useful in development)
    job:
      name: "icg-task-service.job"
      script: path.join(__dirname, "lib/job-task-worker")
  ,
    task: "system.test" # Once every fifteen seconds (useful in development)
    job:
      name: "icg-system-task.job"
      script: path.join(__dirname, "lib/job-task-worker")
  ]
