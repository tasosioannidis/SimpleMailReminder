/**
 * Created by Nikolas on 17/12/2014.
 * @version 0.1.0
 * @description This js get the mail from the INBOX folder and moves compliant
 * mails to a designated folder.
 *
 */

//TODO Maybe keep the connection open and do other stuff. FUTURE

//Imports and Jsons
var Imap = require('imap');
var loginInfo = require('./real-info.json');
var S = require('string');

//Data
var imap = new Imap(loginInfo);
var msgIDsToRemind=[];

/**
 * The config json.
 * @param config
 */
exports.init = function(config) {
    /**
     * Setup listeners.
     */
    imap.once('ready', function () {
        imap.openBox('INBOX', true, function (err, box) {
            imap.search(['UNSEEN'], function (err, results) {
                var f = imap.fetch(results, config.fetchParams);
                f.on('message', function (msg, seqno) {
                    /**
                     * Use to get the mail object stream.
                     * @type {string}
                     * @
                     */
                    var buffer = '';
                    /**
                     * This is a flag for a found mail to be reminded.
                     * @type {boolean}
                     */
                    var gotRemMail = false;

                    /**
                     * This listener stores the attributes of a mail if the flag 'gotReMail'
                     * is raised.
                     */
                    msg.once('attributes', function (attrs) {
                        if (gotRemMail) {
                            msgIDsToRemind.push(attrs.uid);
                            gotRemMail = false;
                        }
                    });
                    /**
                     * This listener check if the subject of a mail has the given ('tagInMail')
                     * unique string.
                     */
                    msg.on('body', function (stream, info) {
                        stream.on('data', function (data) {
                            buffer += data;
                        });
                        stream.on('end', function () {
                            var temp = buffer.split('\n')[1].split("Subject: ");
                            if (S(temp).contains(config.tagInMail)) {
                                console.log("This mail needs to be reminded!");
                                console.log(temp[1]);
                                gotRemMail = true;
                            } else {
                                console.log("Common Junk...");
                            }
                        });
                    });
                });
                f.once('error', function (err) {
                    //TODO Logger here
                    console.error('Found err: ' + err);
                });
                /**
                 * Upon end tf the message reading functions, mail are moved to an other
                 * folder in map ('destinationBox') and the connection to the server is
                 * destroyed.
                 */
                f.once('end', function () {
                    if (msgIDsToRemind.length > 0) {
                        for (var id in msgIDsToRemind)
                            console.log("Mail UID: " + msgIDsToRemind[id] + " needs to be moved.");

                        for (var id in msgIDsToRemind)
                            imap.move(msgIDsToRemind[id], config.destinationBox, function (err) {
                                if (err) throw err;
                            });
                    } else {
                        console.log("No messages found to for the reminder service.");
                    }
                    //Ends the imap connection.
                    imap.end();
                    msgIDsToRemind = [];
                });
            });
        });
    });

    //Connect to the mail server.
    imap.connect();
};