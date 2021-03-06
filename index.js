/**
 *
 * @author Nikolas Andronopoulos
 * @version 1.0.1
 */

'use strict';

/**
 * Configs
 * @type {exports}
 */
var config = require("./config/config.json");
var loginInfo = require('./config/real-info.json');
var moveMailService = require("./lib/findProcessMoveMail.js");
var cleanMailBox = require("./lib/cleanMailBox.js");
var checkRemindService = require('./lib/checkReminds.js');

//CronTab
var crontab = require('node-crontab');

//Logger stuff.
var loggerConfig = require("./config/loggerConfig");
var log4js = require('log4js');
log4js.configure(loggerConfig);

//Main (index.js) logger.
var logger = log4js.getLogger("Main program.");

/**
 * The Imap Object
 * @type {exports}
 */
var Imap = require('imap');

/**
 * Creates the instance of the Imap object with the provided login info.
 * @type {Object}
 * @param {object} The login json.
 */
var imap = new Imap(loginInfo);

//Main listener for open connection to IMAP
imap.on('ready', function () {
    moveMailService(imap, config, log4js.getLogger("[Find Service]"), function () {
        cleanMailBox(imap, config, log4js.getLogger("[Cleaner Service]"), function () {
            checkRemindService(imap, config, log4js.getLogger("[Mail send service.]"), function () {
                imap.end();
                logger.debug("Circle completed.");
            });
        });
    });
});

//Start the thing
logger.info("Starting scheduler");
imap.connect();
//Repeat after X. [default=hourly]
crontab.scheduleJob(config.serviceRepeat, function(){
    imap.connect();
});
