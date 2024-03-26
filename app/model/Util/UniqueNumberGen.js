'use strict';
var pool = require('../../../config/connV2');
/*
    1 = success
*/
var UNG = function (UQ) {

}

var ress;

UNG.showMessage = function (UQ, result) {

    if (UQ != null) {
        switch (UQ) {

            case 'ER_DUP_ENTRY':
                ress = { status: "duplicate" };
                result(ress);
                break;

            case 'ER_NO_DEFAULT_FOR_FIELD':
                ress = { status: "emptyValue" };
                result(ress);
                break;

            case 'B':
                ress = { status: "incompleteDataReceived" };
                result(ress);
                break;

            case 'F':
                ress = { status: "FAIL" };
                result(ress);
                break;

            case '1':
                ress = { status: "SUCCESS" };
                result(ress);
                break;

            case 'TXN':
                ress = { status: "ERROR901" };
                result(ress);
                break;

            case 'balQ':
                ress = { status: "QUOTAFULL" };
                result(ress);
                break;

            case 'ALR':
                ress = { status: "ALREADYREGISTER" };
                result(ress);
                break;

            case 'ER_BAD_FIELD_ERROR':
                ress = { status: "COLUMNWRONG" };
                result(ress);
                break;

            case 'NE':
                ress = { status: "NOTFOUND" };
                result(ress);
                break;

            case 'TQN':
                ress = { status: "TOTALQNULL" };
                result(ress);
                break;

            case 'QN':
                ress = { status: "QUOTANULL" };
                result(ress);
                break;

            case 'EXDE':
                ress = { status: "EMAILXDE" };
                result(ress);
                break;

            case 'PXDE':
                ress = { status: "PASSWORDWRONG" };
                result(ress);
                break;

            case 'AVAIL':
                ress = { status: "AVAILABLE" };
                result(ress);
                break;

            default:
                ress = { status: msg };
                result(ress);
                break;
        }

    }

}

UNG.getLastSequence = function(UQ,result){

    var sql = "SELECT system_cd,system_name,last_seq+00000000000001,weighted FROM jlk_last_seq_no WHERE system_cd = '"+UQ.uq+"'";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, function (err, res) {
          if (err) {
            con.destroy();
          } else {
            con.destroy();
            //if empty,insert new
            if(res === null || !res || res=== "" || !res[0] || res[0] === ""){
                var sqlInsert = "INSERT INTO jlk_last_seq_no(system_cd,system_name,last_seq,weighted,created_by,created_date) VALUES('"+UQ.uq+"','"+UQ.uq+"','00000000000001','13513513513513','JOMEDIC','"+UQ.created_date+"')";
                pool.getConnection(function(errs, cons) {
                    if (errs) throw errs; // not connected!
                    cons.query(sqlInsert,function(errss,resss) {
                      if(errss){
                        cons.destroy();
                        result(err, null);
                      }else{
                        cons.destroy();
                        var datas = [];
                        datas = {
                            system_cd: UQ.uq,
                            system_name: UQ.uq,
                            last_seq: '00000000000001',
                            weighted: '13513513513513' };
                        result(null, datas);
                      }
                  });
                  });
            }else{
                result(null, res);
            }
            
          }
        });
      });
}

UNG.generateNumber = async function(UQ,result){
    var seq = await getSeq(UQ);

    //add zeros in front of the last seq number
    var running = "";
    async function b(last_seq) {
        for (var i = 0; i < (14 - last_seq.toString().length); i++) {
           running += "0";
         }
    return running;
    } 

    // get total A
    var TotalA = 0;
    async function totalA(concateSeq,weighted){
        var splitSeq = concateSeq.split("");
        var splitWeight = weighted.split("");
        
        for (var i = 0; i < weighted.toString().length; i++) {
            var num1 = splitSeq[i];
            var num2 = splitWeight[i];
            TotalA += parseInt(num1) * parseInt(num2);
        }
        return TotalA;
    }

    b(seq.last_seq);
    var cc = running +seq.last_seq.toString(); 
    totalA(cc,seq.weighted);
    var remainder_A = TotalA % 10;
    var finalGenNum = "";
    //check if reminder A is 0 or not
    if(remainder_A === 0 ){
        //check if unique is ACC/ACT or not(if reminder A is 0)
        if(UQ.uq === "ACT" || UQ.uq === "ACC"){
            finalGenNum = cc.toString() + remainder_A.toString();
        }else{
            finalGenNum = UQ.uq+cc.toString() + remainder_A.toString();
        }
    }else if(remainder_A != 0){
        //made new calculation
        var totalB;
        var remiderB;
        var totalC;
        var totalD;

        async function gtotalB(TotalA){
            totalB = TotalA + 10;
            return totalB
        }
        async function gReminderB(totalB){
            remiderB = totalB % 10;
            return remiderB;
        }
        
        async function gTotalC(totalB,reminderB){
            totalC = totalB - reminderB;
            return totalC;
        }
        
        async function gTotalD(totalC,totalA){
            totalD = totalC - totalA;
            return totalD;
        }
        
        gtotalB(TotalA);
        gReminderB(totalB);
        gTotalC(totalB,remiderB);
        gTotalD(totalC,TotalA);

        //check if unique is ACC/ACT or not(if reminder A is not 0)
        if(UQ.uq === "ACT" || UQ.uq === "ACC"){
            finalGenNum = cc.toString() + totalD.toString();
        }else{
            finalGenNum = UQ.uq+cc.toString() + totalD.toString();
        }
    }
    async function updateSeq(finalGenNum,UQ){
        if(finalGenNum != ""){
            var sql = "UPDATE jlk_last_seq_no SET last_seq = last_seq+00000000000001 WHERE system_cd = '"+UQ.uq+"'";
            pool.getConnection(function(errs, cons) {
                if (errs) throw errs; // not connected!
                cons.query(sql,function(errss,resss) {
                  if(errss){
                    cons.destroy();
                  }else{
                    cons.destroy();
                  }
              });
              });
        }
        
    }
    updateSeq(finalGenNum,UQ);
    result(null,finalGenNum);
}


function getSeq(UQ){
    
    var sql = "SELECT system_cd,system_name,last_seq+00000000000001 as last_seq,weighted FROM jlk_last_seq_no WHERE system_cd = '"+UQ.uq+"'";
    
    return new Promise((resolve) =>{
        pool.getConnection(function (err, con) {
            if (err) throw err; // not connected!
            con.query(sql, function (err, res) {
              if (err) {
                con.destroy();
              } else {
                con.destroy();
                //if empty,insert new
                if(res === null || !res || res=== "" || !res[0] || res[0] === ""){
                    var sqlInsert = "INSERT INTO jlk_last_seq_no(system_cd,system_name,last_seq,weighted,created_by,created_date) VALUES('"+UQ.uq+"','"+UQ.uq+"','00000000000001','13513513513513','JOMEDIC','"+UQ.created_date+"')";
                    pool.getConnection(function(errs, cons) {
                        if (errs) throw errs; // not connected!
                        cons.query(sqlInsert,function(errss,resss) {
                          if(errss){
                            cons.destroy();
                            resolve({errcode:errs,status:"xok"});
                          }else{
                            cons.destroy();
                            var datas = [];
                            datas = {
                                system_cd: UQ.uq,
                                system_name: UQ.uq,
                                last_seq: '00000000000001',
                                weighted: '13513513513513' };
                            resolve({system_cd:UQ.uq,system_name:UQ.uq,last_seq:'00000000000001',weighted:'13513513513513',status:"ok"});
                          }
                      });
                      });
                }else{
                    //return res[0];
                    resolve({system_cd:res[0].system_cd,system_name:res[0].system_name,last_seq:res[0].last_seq,weighted:res[0].weighted,status:"ok"});
                }
                
              }
            });
          });
    });
    
}

module.exports = UNG;