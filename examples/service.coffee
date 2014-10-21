winston = require('winston')
domain = require("domain")

serviceManager = require("../icg-task-service-manager")
config = require("./config")

module.exports = ()->
  serviceDomain = domain.create()
  config.winston = winston
  config.log = new (winston.Logger)
    transports: [
      new (winston.transports.Console)({level:'debug', prettyPrint: true, colorize:true, timestamp:true}),
      new (winston.transports.File)({filename: config.logPath, level:config.logLevel, logstash:true, maxsize:config.maxLogSize || 10000000, maxFiles:config.maxLogFiles || 5})
    ]

  # setup reasonable defaults
  config.maxConcurrency or= 3
  config.blockSize or= 200
  config.maxDelay or= 30
  config.maxAttempts or= 100000000
  config.cleanupAfterDays or= 2 #days

  restartAfterDelay = ()->
    setTimeout ()->
      module.exports()
    , 12000


  # serviceDomain.on "dispose", ()->
  #   config.log.info("Domain disposed...restarting in 120 seconds")
  #   restartAfterDelay()

  serviceDomain.on "error", (err)->
    # the service will stop when an uptapped error is encountered
    config.log.error("Untrapped Error", err.stack)
    # restart after 120 seconds
    restartAfterDelay()
    # serviceDomain.exit()

  initService = ()->
    serviceDomain.run ()->
      serviceManager(config)


  initService()
