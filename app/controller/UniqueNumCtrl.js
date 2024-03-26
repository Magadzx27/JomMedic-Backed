'use strict';

var UNQ = require('../model/Util/UniqueNumberGen');
var MM = require('../model/Util/MessageManager');

var msg;
const uniqueNumberGen = function(req,res){
    var txn_cd, datas, tstamp;
    txn_cd = req.body['txn_cd'];
    tstamp = req.body['tstamp'];
    datas = req.body['data'];
    
    //check if transaction code empty or not
    if (!txn_cd || txn_cd === "" || !tstamp || tstamp === "" || !datas.UNQ || datas.UNQ === "") {
        msg = { "msj": "TXN" }
        MM.showMessage("TXN", function (dataMM) {
            res.status(400).send(dataMM);
            res.end();
        });
    }else{
        var uqObj = [];
        uqObj.uq = datas.UNQ;
        uqObj.created_date = tstamp;
        UNQ.generateNumber(uqObj,function(error,returnData){
            res.send(returnData);
            res.end();
        });
    } 
    
}

module.exports = {
    uniqueNumberGen: uniqueNumberGen
};