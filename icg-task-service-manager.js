// Generated by CoffeeScript 1.7.1
(function() {
  var TaskQueue, async, cluster, domain, jobs, logWrapper, moment, oi, path, util, _;

  util = require("util");

  async = require("async");

  path = require("path");

  _ = require("lodash");

  cluster = require('cluster');

  domain = require("domain");

  oi = require("oibackoff");

  TaskQueue = require("icg-task-queue");

  logWrapper = require("./lib/log-wrapper");

  moment = require('moment');

  jobs = [];

  module.exports = function(config, options) {
    var callOpts, e, handler, job, jobDomain, restClient, _ref, _ref1, _ref2;
    config.taskPath || (config.taskPath = "ap/queuedTasks");
    if (cluster.isMaster) {
      if (!config.jobs || config.jobs.length === 0) {
        throw new Error("Missing required configuration option 'jobs'");
      }
      restClient = require("icg-rest-client")(config.apiBaseUrl);
      callOpts = {
        data: {
          userId: config.credentials.user,
          password: config.credentials.password
        }
      };
      restClient.post(config.sessionPath, callOpts, function(err, response) {
        var _ref;
        if (err) {
          if ((_ref = config.log) != null) {
            _ref.error(err);
          }
          throw new Error("Unable to log in to the API");
        } else {
          config.secToken = response.body.secToken;
          if (jobs && jobs.length > 0) {
            _.each(cluster.workers, function(w) {
              return w.kill();
            });
          }
          return _.each(config.jobs, function(jobOptions) {
            var e, initJobWorker, jobWorker, lastHeartbeat, _ref1, _ref2;
            jobOptions.secToken = config.secToken;
            try {
              if ((_ref1 = config.log) != null) {
                _ref1.debug("forking task job onto worker", jobOptions.job);
              }
              lastHeartbeat = null;
              initJobWorker = function() {
                var worker;
                worker = cluster.fork({
                  jobOptions: JSON.stringify(jobOptions)
                });
                lastHeartbeat = new Date();
                worker.on("message", function(msg) {
                  return lastHeartbeat = new Date();
                });
                return worker;
              };
              jobWorker = initJobWorker();
              return setInterval(function() {
                var timeSinceHeartbeat, timeout;
                timeSinceHeartbeat = new Date() - lastHeartbeat;
                timeout = moment.duration(config.deadWorkerProcessTimeout || 360000).asMilliseconds();
                if (timeout > 0) {
                  if (timeSinceHeartbeat > timeout) {
                    config.log.error("Dead worker detected from job " + jobOptions.job.name + " after timeout of " + timeout + "ms");
                    jobWorker.kill();
                    return jobWorker = initJobWorker();
                  }
                } else {
                  return config.log.warn("Invalid deadWorkerProcessTimeout (" + config.deadWorkerProcessTimeout + ") in config");
                }
              }, 10000);
            } catch (_error) {
              e = _error;
              if ((_ref2 = config.log) != null) {
                _ref2.error(e);
              }
              throw e;
            }
          });
        }
      });
      return cluster.on("disconnect", function(worker) {
        return config.log.warn("A worker process disconnected form the cluster.");
      });
    } else {
      options = JSON.parse(process.env.jobOptions);
      job = options.job;
      config.log = logWrapper(options.job.name, config.log, function(text, meta) {
        process.send({
          heartbeat: true
        });
        return true;
      });
      job.backoffPhrase = "No work to process.";
      restClient = require("icg-rest-client")(config.apiBaseUrl, options.secToken);
      if ((_ref = config.log) != null) {
        _ref.info("Loading handler: " + job.script);
      }
      try {
        handler = require(job.script);
      } catch (_error) {
        e = _error;
        if ((_ref1 = config.log) != null) {
          _ref1.error("unable to load:", job.script);
        }
      }
      if ((_ref2 = config.log) != null) {
        _ref2.info("Creating Job Domain for :" + job.script);
      }
      jobDomain = domain.create();
      jobDomain.on("error", function(err) {
        var _ref3;
        if ((_ref3 = config.log) != null) {
          _ref3.error(err);
        }
        setTimeout(function() {
          return process.exit(1);
        }, 5000);
        return cluster.worker.disconnect();
      });
      return jobDomain.run(function() {
        var processOpts, processQ, taskQueue, _ref3, _ref4, _ref5;
        if (!config) {
          return (_ref3 = config.log) != null ? _ref3.error("Invalid Config") : void 0;
        }
        if (!config.apiBaseUrl) {
          return (_ref4 = config.log) != null ? _ref4.error("Missing apiBaseUrl") : void 0;
        }
        if ((_ref5 = config.log) != null) {
          _ref5.debug("Creating Task Queue for " + options.task);
        }
        taskQueue = new TaskQueue({
          secToken: options.secToken,
          taskResourceUrl: config.apiBaseUrl + "/" + config.taskPath,
          log: config.log
        });
        processOpts = {
          backoff: {
            algorithm: 'fibonacci',
            delayRatio: 1,
            maxDelay: (config != null ? config.maxDelay : void 0) || 300,
            maxTries: 1000000
          },
          log: config.log,
          rethrowErrors: true
        };
        return processQ = taskQueue.process(options.task, processOpts, function(task, cb) {
          return handler.apply(this, [task, options, config, cb]);
        });
      });
    }
  };

}).call(this);
