'use strict';

/*
    1 = success
*/
var MM = function (msg) {

    this.msj = msg.msj;
}

var ress;

MM.showMessage = function (msg, result) {

    if (msg != null) {
        switch (msg) {

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

            case 'CREDXDE':
                ress = { status: "IDXDE" };
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

            case 'WRONG':
                ress = { status: "WRONGDATA" };
                result(ress);
                break;

            case 'WRONGT':
                ress = { status: "WRONGTAC" };
                result(ress);
                break;

            case 'EXP':
                ress = { status: "EXPIREDTAC" };
                result(ress);
                break;

            case 'FTAC':
                ress = { status: "FAILUPDATETAC" };
                result(ress);
                break;

            case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
                ress = { status: "INCORRECTDATATYPE" };
                result(ress);
                break;

            case 'ER_PARSE_ERROR':
                ress = { status: "QUERYERROR" };
                result(ress);
                break;

            case 'ER_TRUNCATED_WRONG_VALUE':
                ress = { status: "INCORRECTDATAFORMAT" };
                result(ress);
                break;


            default:
                ress = { status: msg };
                result(ress);
                break;
        }

    }

}





module.exports = MM;