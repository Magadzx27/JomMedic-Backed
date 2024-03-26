'use strict';

var JomProvider = require("../model/providerModel")
var MM = require('../model/Util/MessageManager');
var md5 = require('md5');
var EmailHelper = require('../model/Util/EmailHelper');
const PdfGenerator = require("../model/Util/PdfGenerator");
var moment = require('moment');
var fetch = require('node-fetch');

require('dotenv').config();

var msg;
var newMM;

// req: things requested by frontend
// res: things send to frontend as response
const securityCheckPost = function (req, res) {

    function generateId(UNQ) {
        let bodyData = {
            txn_cd: 'UNQGEN',
            tstamp: moment().format('yyyy-mm-dd HH:MM:ss'),
            data: {
                UNQ: UNQ,
            }
        };

        return fetch('http://192.168.1.105:3001/UNQ', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
        }).then((response) => response.text())
    }

    var txn_cd, datas, tstamp;
    txn_cd = req.body['txn_cd'];
    datas = req.body['data'];
    tstamp = req.body['tstamp'];

    if (!txn_cd || txn_cd === "" || !tstamp || tstamp === "" || !datas) {
        msg = { "msj": "TXN" }
        MM.showMessage("TXN", function (dataMM) {
            res.status(400).send(dataMM);
            res.end();
        });
    } else {

        switch (txn_cd) {

            // Login Authentication 
            case 'AUTH01':
                console.log("i am here in AUTH01");
                if (!datas.user_name || !datas.password || datas.user_name == "" || datas.password == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    console.log("still here in AUTH01");

                    // What was returns
                    JomProvider.checkEmailAuth(datas.user_name, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            console.log(dataBack);
                            if (dataBack === "OK") {
                                JomProvider.login(datas.user_name, md5(datas.password), function (err, data) {
                                    if (err) {
                                        res.send({ status: err.code });
                                    } else {
                                        if (data == null || data.length == 0) {
                                            MM.showMessage("PXDE", function (dataMM) {
                                                res.send(dataMM);
                                                res.end();
                                            });
                                        } else {
                                            var ids = data[0].user_name;
                                            console.log(ids);
                                            JomProvider.updateLogStat(ids, "Online", function (errs, datas) {
                                                if (errs) {
                                                    MM.showMessage(errs.code, function (dataMM) {
                                                        res.send(dataMM);
                                                        res.end();
                                                    });
                                                } else {
                                                    MM.showMessage(data, function (dataMM) {
                                                        res.send(dataMM);
                                                        res.end();
                                                    });
                                                }
                                            });

                                        }
                                    }

                                });
                            } else if (dataBack === "EMAILXDE") {
                                MM.showMessage("EXDE", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });

                }

                break;

            // Change Password
            case 'AUTH02':
                if (!datas.UserId || !datas.OldPassword || !datas.NewPassword || !datas.ConfirmPassword) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else if (datas.NewPassword !== datas.ConfirmPassword) {
                    let responseData = {
                        result: false,
                        value: "Password is not matched",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    JomProvider.changePassword(datas.UserId, datas.OldPassword, datas.NewPassword, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            // Contact Us
            case "CONTACT":
                if (!datas.user_id || !datas.subject || !datas.content || datas.user_id == "" || datas.subject == "" || datas.content == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                }
                else {
                    JomProvider.getEmail(datas.user_id, function (err, modelRes) {
                        if (err) {
                            console.log(err)
                            MM.showMessage(err.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                        else {
                            var email = {
                                receiver: modelRes[0].email,
                                subject: 'JomMedic - Contact Us',
                                text: 'We have received your email. Our staff will contact you soon.',
                                sender: process.env.EMAIL_USER,
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS
                            };

                            EmailHelper.sendGG(email, function (err, result) {
                                if (err) {
                                    console.log(err)
                                    MM.showMessage(err.code, function (dataMM) {
                                        res.send(dataMM);
                                        res.end();
                                    });
                                }
                                else {
                                    MM.showMessage("1", function (dataMM) {
                                        res.send(dataMM);
                                        res.end();
                                    });
                                }
                            });
                        }
                    });
                }
                break;

            // Save Order Master (Insert/Update)
            case "MEDORDER001":
                if ((!datas.order_no || !datas.user_id) || (datas.user_id == "" || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateOrder(datas.order_no, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertOrder(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateOrder(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Order Master Data
            case "MEDORDER002":
                if ((!datas.user_id || !datas.order_no) || (datas.user_id == "" || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getOrder(datas.user_id, datas.order_no, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Delete Order Data
            case 'MEDORDER004':
                if ((!datas.user_id || !datas.order_no) || (datas.user_id == "" || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.deleteOrder(datas.order_no, datas.user_id, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save Order Detail (Insert/Update)
            case "MEDORDER005":
                if ((!datas.order_no || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateOrderDetail(datas.order_no, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertOrderDetail(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateOrderDetail(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Order Details Data
            case "MEDORDER006":
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getOrderDetail(datas.order_no, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Delete Order Detail Data
            case 'MEDORDER008':
                if ((!datas.txn_date || !datas.order_no) || (datas.txn_date == "" || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.deleteOrderDetail(datas.order_no, datas.txn_date, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Queue Data
            case 'MEDORDER009':
                if (!datas.tenant_id || datas.tenant_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getOrderQueue(datas.tenant_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Patient List
            case 'MEDORDER010':
                if (!datas.tenant_id || datas.tenant_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getCustomers(datas.tenant_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Tenant Data
            case 'MEDORDER011':
                console.log("Get Tenant here")
                if ((!datas.user_id || !datas.tenant_type) || (datas.user_id == "" || datas.tenant_type == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getTenant(datas.user_id, datas.tenant_type, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            // Update Order Status to Rejected
            case 'MEDORDER012':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateOrderReject(datas.order_no, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Update Order Status to Active
            case 'MEDORDER013':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateOrderActive(datas.order_no, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Update Order Status to End
            case 'MEDORDER014':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateOrderEnd(datas.order_no, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save Clinic Schedule
            case 'MEDORDER015':
                if ((!datas.user_id || !datas.hfc_cd || !datas.start_date) || (datas.user_id == "" || datas.hfc_cd == "" || datas.start_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateSchedule(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertSchedule(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateSchedule(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });

                }
                break;

            // Save Many Clinic Schedules
            case 'MEDORDER017':
                if (!Array.isArray(datas) || (!datas[0].user_id || !datas[0].hfc_cd || !datas[0].start_date) || (datas[0].user_id == "" || datas[0].hfc_cd == "" || datas[0].start_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateSchedule(datas[0], function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertScheduleMany(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                var promises = [];
                                var pResults = [];
                                (async () => {
                                    for (let i = 0; i < datas.length; i++) {
                                        var data = datas[i];
                                        var promise = await new Promise(
                                            function (resolve, reject) {
                                                JomProvider.updateScheduleMany(data, resolve, reject);
                                            }
                                        ).then((res) => {
                                            pResults.push(res)
                                        }).catch((err) => {
                                            pResults.push(err)
                                        }).finally(
                                            promises.push(promise)
                                        )
                                    }

                                    Promise.all(promises)
                                        .then(() => {
                                            if (pResults.every(element => element === null)) {
                                                MM.showMessage("1", function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            } else {
                                                let error = pResults.find(element => element !== null)
                                                MM.showMessage(error.code, function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            }
                                        })
                                })()
                            }
                        }
                    })
                }
                break;


            // Get Clinc Schedule Data for a User
            case "MEDORDER016":
                if ((!datas.user_id || !datas.hfc_cd || !datas.start_date || !datas.end_date) || (datas.user_id == "" || datas.hfc_cd == "" || datas.start_date == "" || datas.end_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getSchedule(datas.user_id, datas.hfc_cd, datas.start_date, datas.end_date, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Delete Clinic Schedule Data
            case 'MEDORDER018':
                if ((!datas.txn_date || !datas.order_no) || (datas.txn_date == "" || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.deleteSchedule(datas.order_no, datas.txn_date, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Update User Profile (Rework)
            case 'MEDORDER019':
                if (!datas.user_id || datas.user_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateUserProfile(datas, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get User Profile (Rework)
            case 'MEDORDER020':
                if (!datas.user_id || datas.user_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getUserData(datas.user_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }

                break;

            // Get Message Queue All Data
            case 'MEDORDER021':
                console.log('MEDORDER021')
                if (!datas.order_no || datas.order_no == "") {

                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getMessageQueueData(datas.order_no, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }

                break;

            // Get Chat History Data 
            case 'MEDORDER022':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getChat(datas.order_no, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }

                break;

            // Insert Chat History
            case 'MEDORDER023':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.insertChat(datas, tstamp, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }

                break;

            // Update Tenant Status to Available
            case 'MEDORDER024':
                if (!datas.tenant_id || datas.tenant_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateTenantAvailable(datas.tenant_id, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            // Update Tenant Status to Not Available
            case 'MEDORDER025':
                if (!datas.tenant_id || datas.tenant_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateTenantNotAvailable(datas.tenant_id, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Update Tenant Status to Busy
            case 'MEDORDER026':
                if (!datas.tenant_id || datas.tenant_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateTenantBusy(datas.tenant_id, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Update Tenant Status to Offline
            case 'MEDORDER027':
                if (!datas.tenant_id || datas.tenant_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateTenantOffline(datas.tenant_id, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Insert Feedback
            case 'MEDORDER028':
                console.log(datas.order_no)
                if (!datas.order_no || datas.order_no == "") {

                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.insertFeedback(datas, tstamp, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }

                break;

            // Get Feedback
            case 'MEDORDER029':
                if (!datas.feedback_to || datas.feedback_to == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getFeedback(datas.feedback_to, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Customer Chat History for specified customer and specified tenant
            case 'MEDORDER030':
                if ((!datas.user_id || !datas.tenant_id) || (datas.user_id == "" || datas.tenant_id == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getChatHistory(datas.user_id, datas.tenant_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Customer Video Call History for specified customer and specified tenant
            case 'MEDORDER031':
                if ((!datas.user_id || !datas.tenant_id) || (datas.user_id == "" || datas.tenant_id == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getCallHistory(datas.user_id, datas.tenant_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get the last and final chat for an order (Only return one message)
            case 'MEDORDER032':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getFinalChat(datas.order_no, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Price of a service using the service code (Service Type)
            case 'MEDORDER033':
                if (!datas.service_type || datas.service_type == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getPrice(datas.service_type, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Customer Chat History for specified customer and specified tenant with Final Message
            case 'MEDORDER034':
                if ((!datas.user_id || !datas.tenant_id) || (datas.user_id == "" || datas.tenant_id == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getChatHistoryWithMessage(datas.user_id, datas.tenant_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Feedback with customer name and picture
            case 'MEDORDER035':
                if (!datas.feedback_to || datas.feedback_to == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getFeedbackWithProfile(datas.feedback_to, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Appointments for a tenant with specified dates, with some customer data
            case 'MEDORDER036':
                if ((!datas.hfc_cd || !datas.start_date || !datas.end_date) ||
                    (datas.hfc_cd == "" || datas.start_date == "" || datas.end_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getAppointments(datas.hfc_cd, datas.start_date, datas.end_date, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Search complaint with name / description keyword
            case 'MEDORDER037':
                if ((!datas.keyword || datas.keyword == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.searchComplaint(datas.keyword, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Search diagnosis with name / description keyword
            case 'MEDORDER039':
                if ((!datas.keyword || datas.keyword == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.searchDiagnosisName(datas.keyword, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save complaint into database
            case "MEDORDER041":
                console.log("MEDORDER041--------------------sss-")

                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date || !datas.symptom_cd) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "" || datas.symptom_cd == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing complaint         
                    JomProvider.checkDuplicateComplaint(datas, function (error, dataBack) {
                        console.log("MEDORDER041--------------------sss-")
                        if (error) {

                            res.send({ status: error.code });
                        } else {
                            console.log(dataBack)
                            if (dataBack === "OK") {
                                console.log("MEDORDER041----herer")

                                // Insert if no duplicate
                                JomProvider.insertComplaint(datas, tstamp, function (errs, datas) {
                                    if (errs) {

                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                console.log("MEDORDER041-----------------aaa-----")
                                // Update if duplicate exists
                                JomProvider.updateComplaint(datas, function (errs, datas) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Complaints for a consultation session 
            case 'MEDORDER042':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getComplaints(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            // Delete Complaint from database
            case 'MEDORDER043':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date || !datas.symptom_cd) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "" || datas.symptom_cd == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.deleteComplaint(datas, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save diagnosis into database
            case "MEDORDER044":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date || !datas.diagnosis_cd) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "" || datas.diagnosis_cd == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateDiagnosis(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertDiagnosis(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateDiagnosis(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Diagnosises for a consultation session 
            case 'MEDORDER045':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getDiagnosises(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            // Delete Diagnosis from database
            case 'MEDORDER046':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date || !datas.diagnosis_cd) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "" || datas.diagnosis_cd == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.deleteDiagnosis(datas, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save a temperature record into database
            case "MEDORDER047":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateTemperature(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertTemperature(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateTemperature(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Temperature Record for a consultation session 
            case 'MEDORDER048':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getTemperature(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save a blood pressrue record into database
            case "MEDORDER049":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateBP(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertBP(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateBP(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get blood pressure Record for a consultation session 
            case 'MEDORDER050':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getBP(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Search provider with name (healthcare facility)
            case 'MEDORDER051':
                if ((!datas.keyword || datas.keyword == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.searchProvider(datas.keyword, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                console.log(dataMM)
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Search drugs with description/name
            case 'MEDORDER052':
                if ((!datas.keyword || !datas.hfc_cd) || (datas.keyword == "" || datas.hfc_cd == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.searchDrugName(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                console.log(dataMM)
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get Drug Data using Drug Code & Batch No
            case 'MEDORDER053':
                if ((!datas.ud_mdc_code || !datas.hfc_cd) || (datas.ud_mdc_code == "" || datas.hfc_cd == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getDrugData(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Check for provider name using the provider health_facility_code
            case 'MEDORDER054':
                if (!datas.hfc_cd || datas.hfc_cd == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.searchProviderName(datas.hfc_cd, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Insert a medication order master into pmi_order_master
            case "MEDORDER055":
                if ((!datas.order_no || !datas.pmi_no || !datas.health_facility_code) ||
                    (datas.order_no == "" || datas.pmi_no == "" || datas.health_facility_code == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateMedicationMaster(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertMedicationMaster(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Send duplicate exists message if duplicate exists
                                MM.showMessage(dataBack, function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });
                }
                break;

            // Select medication order master data for a consultation session from pmi_order_master
            case 'MEDORDER056':
                if ((!datas.order_no || !datas.pmi_no) || (datas.order_no == "" || datas.pmi_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getMedicationMaster(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save a medication into database
            case "MEDORDER057":
                if ((!datas.order_no || !datas.drug_item_code) || (datas.order_no == "" || datas.drug_item_code == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateMedication(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertMedication(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateMedication(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get medications for a consultation session 
            case 'MEDORDER058':
                if ((!datas.order_no || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getMedications(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            // Delete a medication from database
            case 'MEDORDER059':
                if ((!datas.order_no || !datas.drug_item_code) || (datas.order_no == "" || datas.drug_item_code == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.deleteMedication(datas, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // End an appointment with data 
            case 'MEDORDER060':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.endAppointment(datas, tstamp, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Cancel an appointment 
            case 'MEDORDER061':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.cancelAppointment(datas, tstamp, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get message queue data of an order, status pending
            case 'MEDORDER062':
                if (!datas.order_no || datas.order_no == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getMessageQueueDataPending(datas.order_no, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }

                break;

            // Save an oxygen saturation record into database
            case "MEDORDER063":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateOxygenSaturation(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertOxygenSaturation(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateOxygenSaturation(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Oxygen Saturation record for a consultation session 
            case 'MEDORDER064':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getOxygenSaturation(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save an respiratory rate record into database
            case "MEDORDER065":
                // hfc_cd is the tenant_id, not hfc code
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateRespiratoryRate(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertRespiratoryRate(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateRespiratoryRate(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Respiratory Rate record for a consultation session 
            case 'MEDORDER066':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getRespiratoryRate(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save an blood glucose record into database
            case "MEDORDER067":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateBloodGlucose(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertBloodGlucose(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateBloodGlucose(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Blood Glucose record for a consultation session 
            case 'MEDORDER068':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getBloodGlucose(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save a Cholesterol record into database
            case "MEDORDER069":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing schedule         
                    JomProvider.checkDuplicateCholesterol(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertCholesterol(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateCholesterol(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get Cholesterol record for a consultation session 
            case 'MEDORDER070':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getCholesterol(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Save a weight & height record into database
            case "MEDORDER071":
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        console.log(datas)
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    // Check any existing records         
                    JomProvider.checkDuplicateWeightHeight(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                // Insert if no duplicate
                                JomProvider.insertWeightHeight(datas, tstamp, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            } else if (dataBack === "duplicate") {
                                // Update if duplicate exists
                                JomProvider.updateWeightHeight(datas, function (errs, datasx) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            // Get weight & height record for a consultation session 
            case 'MEDORDER072':
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.encounter_date || !datas.episode_date) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.encounter_date == "" || datas.episode_date == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getWeightHeight(datas, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Send Prescription Slip to Patient Email
            case 'MEDORDER073':
                // Validate the prescription slip request
                if ((!datas.hfc_cd || !datas.pmi_no || !datas.order_no) ||
                    (datas.hfc_cd == "" || datas.pmi_no == "" || datas.order_no == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {

                    // Initialize the required data
                    var patientData = null;
                    var doctorData = null;
                    var medicationMasterData = null;
                    var medicationsData = null;
                    var hfcData = null;

                    var promises = [];
                    var pResults = [];
                    (async () => {
                        // Seperate Promise for each query
                        // Patient Data
                        var promise = await new Promise(
                            function (resolve, reject) {
                                JomProvider.getUserDataWithId(datas.pmi_no, resolve, reject);
                            }
                        ).then((res) => {
                            patientData = res
                            pResults.push(null)
                        }).catch((err) => {
                            pResults.push(err)
                        }).finally(
                            promises.push(promise)
                        )

                        // Doctor Data
                        var promise = await new Promise(
                            function (resolve, reject) {
                                JomProvider.getTenantWithTenantId(datas.hfc_cd, resolve, reject);
                            }
                        ).then((res) => {
                            doctorData = res
                            pResults.push(null)
                        }).catch((err) => {
                            pResults.push(err)
                        }).finally(
                            promises.push(promise)
                        )

                        // Medication Master Data
                        var promise = await new Promise(
                            function (resolve, reject) {
                                JomProvider.getMedicationMasterPromise(datas.order_no, datas.pmi_no, resolve, reject);
                            }
                        ).then((res) => {
                            medicationMasterData = res
                            pResults.push(null)
                        }).catch((err) => {
                            pResults.push(err)
                        }).finally(
                            promises.push(promise)
                        )

                        // Medications Data
                        var promise = await new Promise(
                            function (resolve, reject) {
                                JomProvider.getMedicationsPromise(datas.order_no, resolve, reject);
                            }
                        ).then((res) => {
                            medicationsData = res
                            pResults.push(null)
                        }).catch((err) => {
                            pResults.push(err)
                        }).finally(
                            promises.push(promise)
                        )

                        // Hfc Data
                        // var promise = await new Promise(
                        //     function (resolve, reject) {
                        //         JomProvider.getHealthFacility(datas.health_facility_code, resolve, reject);
                        //     }
                        // ).then((res) => {
                        //     hfcData = res
                        //     pResults.push(null)
                        // }).catch((err) => {
                        //     pResults.push(err)
                        // }).finally(
                        //     promises.push(promise)
                        // )

                        console.log(pResults)

                        Promise.all(promises)
                            .then(() => {
                                // Check is all data obtained, show error if not
                                if (pResults.every(element => element === null)) {
                                    var prescriptionSlip = null;

                                    // Skip pdf generation if no medication master data is detected (No medications are prescribed)
                                    if (!medicationMasterData) {
                                        // Return success if medicationmaster is falsey 
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        // Return success if medicationmaster is empty object or empty array
                                        if (typeof (medicationMasterData) === 'object') {
                                            if (JSON.stringify(medicationMasterData) === '{}' || JSON.stringify(medicationMasterData) === '[]') {
                                                MM.showMessage("1", function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            }
                                        }
                                        // Check any medications prescribed
                                        if (!medicationsData) {
                                            // Return success if medications are falsey 
                                            MM.showMessage("1", function (dataMM) {
                                                res.send(dataMM);
                                                res.end();
                                            });
                                        } else {
                                            // Return success if medications are empty object or empty array
                                            if (typeof (medicationsData) === 'object') {
                                                if (JSON.stringify(medicationsData) === '{}' || JSON.stringify(medicationsData) === '[]') {
                                                    MM.showMessage("1", function (dataMM) {
                                                        res.send(dataMM);
                                                        res.end();
                                                    });
                                                }
                                            }
                                        }
                                    }

                                    // Generate the Prescription Slip Pdf File
                                    try {
                                        prescriptionSlip = PdfGenerator.generatePrescription(patientData, doctorData, medicationMasterData, medicationsData);
                                        // prescriptionSlip = PdfGenerator.generatePrescription(patientData, doctorData, hfcData, medicationMasterData, medicationsData);
                                    } catch (err) {
                                        console.log(err);
                                    }

                                    // Attach the file to email 
                                    var email = {
                                        receiver: patientData[0].email,
                                        subject: 'JomMedic - Prescription Slip',
                                        text: 'Your consulation session ends and thank you for using JomMedic. \nHere is your prescription slip for ' + datas.order_no + '. \nYou can collect your medication at any pharmacy.',
                                        attachments: {
                                            fileName: 'PrescriptionSlip-' + datas.order_no + '.pdf',
                                            content: prescriptionSlip,    // The pdf doc from pdfGenerator
                                            contentType: 'application/pdf',
                                        },
                                        sender: process.env.EMAIL_USER,
                                        user: process.env.EMAIL_USER,
                                        pass: process.env.EMAIL_PASS
                                    };

                                    // Send the email
                                    EmailHelper.sendGGWithAttachments(email, function (err, result) {
                                        if (err) {
                                            console.log(err, "efdnbdbf")
                                            MM.showMessage(err.code, function (dataMM) {
                                                res.send(dataMM);
                                                res.end();
                                            });
                                        } else {
                                            // auditData = {id:resultId[0].user_id,txn_cd:txn_cd,tstamp:tstamp,activity:"TACEMAIL",created_by : resultId[0].user_id};
                                            // processAudit(auditData);
                                            MM.showMessage("1", function (dataMM) {
                                                res.send(dataMM);
                                                res.end();
                                            });
                                        }
                                    });
                                }
                                else {

                                    let error = pResults.find(element => element !== null)
                                    MM.showMessage(error.code, function (dataMM) {
                                        res.send(dataMM);
                                        res.end();
                                    });
                                }
                            })
                    })()
                }
                break;

            // Receive the payment from customer
            case 'MEDORDER074':
                if ((!datas.user_id || !datas.payment) || (datas.user_id == "" || datas.payment == "")) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.checkEWalletAuth(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "OK") {
                                JomProvider.updateEWalletAmount(datas, function (errs, datas) {
                                    if (errs) {
                                        MM.showMessage(errs.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        MM.showMessage("1", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    }
                                })
                            } else if (dataBack === "EMAILXDE") {
                                MM.showMessage("EXDE", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });
                }
                break;

            // Validate EWallet
            case 'MEDORDER075':
                if (!datas.user_id || datas.user_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.checkEWalletAuth(datas, function (error, dataBack) {
                        if (error) {
                            res.send({ status: err.code });
                        } else {
                            if (dataBack === "EMAILXDE") {
                                Promise.all([generateId("EWL")]).then(
                                    ([eWalletId]) => {
                                        JomProvider.insertEWallet(datas, eWalletId, function (errs, datas) {
                                            if (errs) {
                                                MM.showMessage(errs.code, function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            } else {
                                                MM.showMessage("1", function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            }
                                        })
                                    }
                                )
                            } else if (dataBack === "OK") {
                                MM.showMessage("1", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });
                }
                break;

            // Update User Profile (Rework)
            case 'MEDORDER019-2':
                if (!datas.user_id || datas.user_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.updateUserProfile2(datas, req.file.buffer, function (errs, datasx) {
                        if (errs) {
                            MM.showMessage(errs.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            // Get User Profile (Rework)
            case 'MEDORDER020-2':
                if (!datas.user_id || datas.user_id == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    JomProvider.getUserData2(datas.user_id, function (error, result) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(result, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            default:
                MM.showMessage("TXN", function (dataMM) {
                    res.send(dataMM);
                    res.end();
                });
                break;
        }
    }
}


module.exports = {
    securityCheckPost: securityCheckPost
};