'use strict';

var Provid = require('../model/provider');
var ewallet = require('../model/ewallet');
var MM = require('../model/Util/MessageManager');
var AUT = require('../model/Util/AuditTrail');
var md5 = require('md5');
var EmailHelper = require('../model/Util/EmailHelper');
var generator = require('generate-password');
require('dotenv').config();

var msg;
var newMM;
var auditData;
//date format must YYYY-MM-DD
//datetime format must YYYY-MM-DD HH:MM:SS

//process audit trail
function processAudit(datas) {
    AUT.create(datas, function (err, data) {
        if (err) {
            console.log("audit fail : " + datas.id + " on " + datas.tstamp);
            return err;
        } else {
            console.log("audit success : " + datas.id + " on " + datas.tstamp);
            return "1";
        }
    });
}


const loginPost = function (req, res) {
    //this is compulsory item
    var txn_cd, datas, tstamp;
    txn_cd = req.body['txn_cd'];
    tstamp = req.body['tstamp'];
    datas = req.body['data'];

    //check if transaction code empty or not
    if (!txn_cd || txn_cd === "" || !tstamp || tstamp === "" || !datas) {
        msg = { "msj": "TXN" }
        MM.showMessage("TXN", function (dataMM) {
            res.status(400).send(dataMM);
            res.end();
        });
    } else {

        switch (txn_cd) {
            case 'MEDAUTH01':
                console.log("cnivnisnv")
                if (!datas.userID || datas.userID == "" || !datas.password || datas.password == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    //check id exist not
                    ewallet.checkUserId(datas.userID, function (err, response) {
                        if (err) {
                            //res.send({status:err.code});
                            MM.showMessage(err.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (!response[0] || response[0] == "") {
                                MM.showMessage("CREDXDE", function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            } else {
                                //check password correct or not
                                ewallet.login(datas, function (error, result) {
                                    if (error) {
                                        //res.send({status:err.code});
                                        MM.showMessage(error.code, function (dataMM) {
                                            res.status(400).send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        if (!result[0] || result[0] == "") {
                                            MM.showMessage("PXDE", function (dataMM) {
                                                res.status(400).send(dataMM);
                                                res.end();
                                            });
                                        } else {
                                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "LOGIN", created_by: datas.userID };
                                            processAudit(auditData);
                                            MM.showMessage("1", function (dataMM) {
                                                res.send(dataMM);
                                                res.end();
                                            });
                                        }

                                    }
                                });
                            }
                        }
                    });
                }
                break;
        }
    }
}

module.exports = {
    loginPost: loginPost
};