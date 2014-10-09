fs = require("fs")
os = require("os")
path = require("path")
util = require("util")
_ = require("lodash")

module.exports = (task, options, config, cb)->
  monitor =
    serviceName: config.serviceName
    processId: process.pid
    jobName: options.name
    lastMessage: "Job Starting"
    lastStatus: "Healthy"
    hostName: os.hostname()

  restClient = require("icg-rest-client")(config.apiBaseUrl, options.secToken)
  try
    now = new Date()
    # Tell the service monitor that you are starting the job.
    smPath = "ap/serviceMonitors/#{monitor.serviceName}/#{monitor.jobName}"
    restClient.put smPath, data:monitor, (err, sm)->
      if err
        cb(err)
      else

        config.log.warn("Don't forget to add some functionality to your job.")

        monitor.lastMessage = "Job Complete"
        restClient.put smPath, data:monitor, cb


  catch e
    cb(e)
