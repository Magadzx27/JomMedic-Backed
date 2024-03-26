'use strict';

var MM = require('../model/Util/MessageManager');
var AUT = require('../model/Util/AuditTrail');
var md5 = require('md5');
var EmailHelper = require('../model/Util/EmailHelper');
var generator = require('generate-password');
var ewallet = require('../model/ewallet');
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



const ewalletCheckPost = function (req, res) {

    function generateId(UNQ) {
        let bodyData = {
            txn_cd: 'UNQGEN',
            tstamp: moment().format('yyyy-mm-dd HH:MM:ss'),
            data: {
                UNQ: UNQ,
            }
        };

        return fetch('http://localhost:3001/UNQ', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
        }).then((response) => response.text())
    }
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

            //send email TAC code
            case 'MEDVER01':
                if (!datas.email || datas.email == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var vercode = generator.generate({
                        length: 6,
                        numbers: true,
                        symbols: false,
                        lowercase: false,
                        uppercase: false,
                        excludeSimilarCharacters: false,
                        strict: false,
                    });

                    var data = {
                        receiver: datas.email,
                        subject: 'JomMedic - Verification Code',
                        text: 'You are receiving this because you (or someone else) have requested verification code for your account.\n\n'
                            + vercode + `\n\n`,
                        sender: process.env.EMAIL_USER,
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS

                    };
                    ewallet.getIdEmail(datas, function (errorId, resultId) {
                        if (errorId) {
                            MM.showMessage(errorId.code, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        } else {
                            if (!resultId[0] || resultId[0] == "") {
                                MM.showMessage("CREDXDE", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            } else {
                                var dataTxn = {
                                    user_id: resultId[0].user_id,
                                    txn_date: tstamp,
                                    txn_code: "TAC",
                                    tac_code: vercode,
                                    status: "0",
                                    created_by: resultId[0].user_id,
                                    created_date: tstamp,
                                    amount: 0.0,
                                    quantity: 0,
                                    id_type: "",
                                    id_no: "",
                                    photo_id: "",
                                    photo_yourself: "",
                                    sender_acc_no: "",
                                    receiver_acc_no: "",
                                    ewallet_acc_no: ""
                                };

                                var dataTac = {
                                    tac_code: vercode,
                                    txn_date: tstamp,
                                    created_by: resultId[0].user_id,
                                    created_date: tstamp,
                                    status: "1"
                                };

                                ewallet.insertEwlTxn(dataTxn, function (errorTxn, resultTxn) {
                                    if (errorTxn) {
                                        MM.showMessage(errorTxn.code, function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        ewallet.insertTac(dataTac, function (errorTac, resultTac) {
                                            if (errorTac) {
                                                MM.showMessage(errorTac.code, function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            } else {
                                                EmailHelper.sendGG(data, function (err, result) {
                                                    if (err) {
                                                        MM.showMessage(err.code, function (dataMM) {
                                                            res.send(dataMM);
                                                            res.end();
                                                        });
                                                    } else {
                                                        auditData = { id: resultId[0].user_id, txn_cd: txn_cd, tstamp: tstamp, activity: "TACEMAIL", created_by: resultId[0].user_id };
                                                        processAudit(auditData);
                                                        MM.showMessage("1", function (dataMM) {
                                                            res.send(dataMM);
                                                            res.end();
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
                break;

            //verify tac
            case 'MEDEWALL01':
                if (!datas.userID || datas.userID == "" || !datas.TAC || datas.TAC == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        user_id: datas.userID
                    };
                    ewallet.getTac(param, function (errorTac, resultTac) {
                        if (errorTac) {
                            MM.showMessage(errorTac.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (!resultTac[0] || resultTac[0] == "") {
                                MM.showMessage("NE", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            } else {
                                var now = Date.now();
                                if (datas.TAC === resultTac[0].tac_code) {
                                    if (now > resultTac[0].expire_date) {
                                        MM.showMessage("EXP", function (dataMM) {
                                            res.send(dataMM);
                                            res.end();
                                        });
                                    } else {
                                        var dataUpTac = {
                                            tac_code: datas.TAC,
                                            txn_date: resultTac[0].txn_date
                                        };
                                        ewallet.updateTAC(dataUpTac, function (errorUpTac, resultUpTac) {
                                            if (errorUpTac) {
                                                MM.showMessage("FTAC", function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            } else {
                                                auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "VERIFY TAC", created_by: datas.userID };
                                                processAudit(auditData);
                                                MM.showMessage("1", function (dataMM) {
                                                    res.send(dataMM);
                                                    res.end();
                                                });
                                            }
                                        });

                                    }
                                } else {
                                    MM.showMessage("WRONGT", function (dataMM) {
                                        res.send(dataMM);
                                        res.end();
                                    });
                                }
                            }
                        }
                    });
                }
                break;

            //insert ewl account
            case 'MEDEWALL02':
                if (!datas.userID || datas.userID == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    if (datas.availableAmt === "" || !datas.availableAmt) {
                        datas.availableAmt = 0;
                    }

                    if (datas.freezeAmt === "" || !datas.freezeAmt) {
                        datas.freezeAmt = 0;
                    }

                    if (datas.floatAmt === "" || !datas.floatAmt) {
                        datas.floatAmt = 0;
                    }


                    var param = {
                        user_id: datas.userID,
                        ewallet_acc_no: datas.ewalletAccNo,
                        bank_acc_no: datas.bankAccNo,
                        credit_card_no: datas.creditCardNo,
                        available_amt: datas.availableAmt,
                        freeze_amt: datas.freezeAmt,
                        float_amt: datas.floatAmt,
                        currency_cd: datas.currencyCd,
                        status: datas.status,
                        create_by: datas.userID,
                        created_date: tstamp
                    }

                    ewallet.insertEwlAcc(param, function (errorAcc, resultAcc) {
                        if (errorAcc) {
                            MM.showMessage(errorAcc.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "INSERT", created_by: datas.userID };
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    })
                }
                break;

            //update ewl account
            case 'MEDEWALL03':
                if (!datas.userID || datas.userID == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    if (datas.availableAmt === "" || !datas.availableAmt) {
                        datas.availableAmt = 0;
                    }

                    if (datas.freezeAmt === "" || !datas.freezeAmt) {
                        datas.freezeAmt = 0;
                    }

                    if (datas.floatAmt === "" || !datas.floatAmt) {
                        datas.floatAmt = 0;
                    }


                    var param = {
                        user_id: datas.userID,
                        ewallet_acc_no: datas.ewalletAccNo,
                        bank_acc_no: datas.bankAccNo,
                        credit_card_no: datas.creditCardNo,
                        available_amt: datas.availableAmt,
                        freeze_amt: datas.freezeAmt,
                        float_amt: datas.floatAmt,
                        currency_cd: datas.currencyCd,
                        status: datas.status
                    }

                    ewallet.updateEwlAcc(param, function (errorAcc, resultAcc) {
                        if (errorAcc) {
                            MM.showMessage(errorAcc.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "UPDATE", created_by: datas.userID };
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    })
                }
                break;

            //get ewl Account
            case 'MEDEWALL04':
                if (!datas.userID || datas.userID == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        user_id: datas.userID
                    }
                    ewallet.getEwlAcc(param, function (errorAcc, resultAcc) {
                        if (errorAcc) {
                            MM.showMessage(errorAcc.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (resultAcc[0] || !resultAcc[0] == "") {
                                MM.showMessage(resultAcc[0], function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            } else {
                                MM.showMessage("NE", function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    })
                }
                break;

            case 'MEDEWALL04-1':
                if (!datas.ewalletAccNo || datas.ewalletAccNo == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        ewallet_acc_no: datas.ewalletAccNo
                    }
                    ewallet.getEwlAcc1(param, function (errorAcc, resultAcc) {
                        if (errorAcc) {
                            MM.showMessage(errorAcc.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (resultAcc[0] || !resultAcc[0] == "") {
                                MM.showMessage(resultAcc[0], function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            } else {
                                MM.showMessage("NE", function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    })
                }
                break;

            //insert ewl txn
            case 'MEDEWALL05':
                if (!datas.userID || datas.userID === "" || !datas.txnDate || datas.txnDate === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                    console.log(" or sini");
                } else {
                    if (datas.amount === "" || !datas.amount) {
                        datas.amount = 0;
                    }

                    if (datas.quantity === "" || !datas.quantity) {
                        datas.quantity = 0;
                    }
                    var param = {
                        user_id: datas.userID,
                        txn_date: datas.txnDate,
                        ewallet_acc_no: datas.ewalletAccNo,
                        txn_code: datas.txnCode,
                        amount: datas.amount,
                        quantity: datas.quantity,
                        id_type: datas.idType,
                        id_no: datas.idNo,
                        photo_id: datas.photoId,
                        photo_yourself: datas.photoYourself,
                        sender_acc_no: datas.senderAccNo,
                        receiver_acc_no: datas.receiverAccNo,
                        tac_code: datas.tacCode,
                        status: datas.status,
                        created_by: datas.userID,
                        created_date: tstamp
                    };

                    ewallet.insertEwlTxn(param, function (errorTxn, resultTxn) {
                        if (errorTxn) {
                            MM.showMessage(errorTxn.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "INSERT", created_by: datas.userID };
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //update ewl txn
            case 'MEDEWALL06':
                if (!datas.userID || datas.userID === "" || !datas.txnDate || datas.txnDate === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    if (datas.amount === "" || !datas.amount) {
                        datas.amount = 0;
                    }

                    if (datas.quantity === "" || !datas.quantity) {
                        datas.quantity = 0;
                    }
                    var param = {
                        user_id: datas.userID,
                        txn_date: datas.txnDate,
                        ewallet_acc_no: datas.ewalletAccNo,
                        txn_code: datas.txnCode,
                        amount: datas.amount,
                        quantity: datas.quantity,
                        id_type: datas.idType,
                        id_no: datas.idNo,
                        photo_id: datas.photoId,
                        photo_yourself: datas.photoYourself,
                        sender_acc_no: datas.senderAccNo,
                        receiver_acc_no: datas.receiverAccNo,
                        tac_code: datas.tacCode,
                        status: datas.status,
                        created_by: datas.userID,
                        created_date: tstamp
                    };

                    ewallet.updateEwlTxn(param, function (errorTxn, resultTxn) {
                        if (errorTxn) {
                            MM.showMessage(errorTxn.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "UPDATE", created_by: datas.userID };
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //get ewl txn specific
            case 'MEDEWALL07':
                if (!datas.userID || datas.userID === "" || !datas.txnDate || datas.txnDate === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        user_id: datas.userID,
                        txn_date: datas.txnDate
                    }
                    ewallet.getEwlTxnS(param, function (errorTxn, resultTxn) {
                        if (errorTxn) {
                            MM.showMessage(errorTxn.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (!resultTxn[0] || resultTxn[0] === "") {
                                MM.showMessage("NE", function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            } else {
                                MM.showMessage(resultTxn[0], function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });
                }
                break;

            //get ewl txn all
            case 'MEDEWALL08':


                if (!datas.userID || datas.userID === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        user_id: datas.userID
                    }
                    ewallet.getEwlTxnAll(param, function (errorTxn, resultTxn) {
                        if (errorTxn) {
                            MM.showMessage(errorTxn.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (!resultTxn[0] || resultTxn[0] === "") {
                                MM.showMessage("NE", function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            } else {
                                MM.showMessage(resultTxn, function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });
                }
                break;

            //insert ewl reload pin
            case 'MEDEWALL09':
                if (!datas.pinNumber || datas.pinNumber === "" || !datas.userID || datas.userID === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        pin_number: datas.pinNumber,
                        wallet_acc_no: datas.walletAccNo,
                        txn_date: datas.txnDate,
                        status: datas.status,
                        created_by: datas.userID,
                        created_date: tstamp
                    };

                    ewallet.insertReloadPin(param, function (errorPin, resultPin) {
                        if (errorPin) {
                            MM.showMessage(errorPin.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "INSERT", created_by: datas.userID };
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //update ewl reload pin
            case 'MEDEWALL10':
                if (!datas.pinNumber || datas.pinNumber === "" || !datas.userID || datas.userID === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        pin_number: datas.pinNumber,
                        wallet_acc_no: datas.walletAccNo,
                        txn_date: datas.txnDate,
                        status: datas.status,
                        created_by: datas.userID,
                        created_date: tstamp
                    };

                    ewallet.updateReloadPin(param, function (errorPin, resultPin) {
                        if (errorPin) {
                            MM.showMessage(errorPin.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = { id: datas.userID, txn_cd: txn_cd, tstamp: tstamp, activity: "UPDATE", created_by: datas.userID };
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //get ewl txn specific date range
            case 'MEDEWALL11':
                if (!datas.userID || datas.userID === "" || !datas.dateFrom || !datas.dateTo || datas.dateFrom === "" || datas.dateTo === "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var param = {
                        user_id: datas.userID,
                        date_from: datas.dateFrom,
                        date_to: datas.dateTo
                    }
                    ewallet.getEwlTxnDR(param, function (errorTxn, resultTxn) {
                        if (errorTxn) {
                            MM.showMessage(errorTxn.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            if (!resultTxn[0] || resultTxn[0] === "") {
                                MM.showMessage("NE", function (dataMM) {
                                    res.status(400).send(dataMM);
                                    res.end();
                                });
                            } else {
                                MM.showMessage(resultTxn, function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
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
    ewalletCheckPost: ewalletCheckPost
};