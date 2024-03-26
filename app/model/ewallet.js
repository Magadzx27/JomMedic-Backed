var pool = require('../../config/connV2');
var md5 = require('md5');

var Ewallet = function (ewallet) {

}

//this for check user id exist
Ewallet.checkUserId = function (userID, result) {
  var sql;
  sql = "SELECT user_id FROM jlk_users WHERE user_id = ? ";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, [userID], function (err, res) {
      if (err) {
        con.destroy();
        result(err, null);
      } else {
        con.destroy();
        result(null, res);
      }
    });
  });
}

//this for login
Ewallet.login = function (data, result) {
  var sql;
  sql = "SELECT user_id,user_name,title,password,question,answer,mother_name,user_status,login_status,id_category_cd,start_date,end_date,remote_logout_date,remote_count,user_type,user_category,user_classification_cd,status,room_no FROM jlk_users WHERE user_id = ? AND password = ? ";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, [data.userID, md5(data.password)], function (err, res) {
      if (err) {
        con.destroy();
        result(err, null);
      } else {
        con.destroy();
        result(null, res);
      }
    });
  });
}

//get id by email
Ewallet.getIdEmail = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT user_id FROM jlk_user_profile WHERE email = '" + data.email + "' ;";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
};

//insert tac
Ewallet.insertTac = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "INSERT INTO ewl_tac_code(tac_code,txn_date,status,created_by,created_date,expire_date)" +
      " VALUES('" + data.tac_code + "','" + data.txn_date + "','" + data.status + "','" + data.created_by + "','" + data.created_date + "',(NOW() + INTERVAL 5 MINUTE))";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
};

//get tac
Ewallet.getTac = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT tac.tac_code,tac.expire_date,tac.txn_date ac_code tac JOIN ewl_transaction TXN ON TXN.tac_code = tac.tac_code AND TXN.txn_date = tac.txn_date AND TXN.txn_code = 'TAC' " +
      " WHERE TXN.user_id = '" + data.user_id + "' AND tac.status = '1' ORDER BY  tac.expire_date DESC LIMIT 1";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
};

//update tac
Ewallet.updateTAC = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "UPDATE ewl_tac_code SET status = '0' WHERE tac_code = '" + data.tac_code + "' AND txn_date = '" + data.txn_date + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
};

//get current tac
Ewallet.getCurrentTAC = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT TAC from jlk_users WHERE user_id = '" + data.user_id + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

// insert ewalet transaction
Ewallet.insertEwlTxn = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "INSERT INTO ewl_transaction (user_id,txn_date,ewallet_acc_no,txn_code,amount,quantity,id_type,id_no,photo_id,photo_yourself,sender_acc_no,receiver_acc_no,tac_code,status,created_by,created_date) VALUES ('" + data.user_id + "','" + data.txn_date + "','" + data.ewallet_acc_no + "','" + data.txn_code + "','" + data.amount + "','" + data.quantity + "','" + data.id_type + "','" + data.id_no + "','" + data.photo_id + "','" + data.photo_yourself + "','" + data.sender_acc_no + "','" + data.receiver_acc_no + "','" + data.tac_code + "','" + data.status + "','" + data.created_by + "','" + data.created_date + "')";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//update ewallet transaction
Ewallet.updateEwlTxn = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "UPDATE ewl_transaction SET ewallet_acc_no = '" + data.ewallet_acc_no + "' ,txn_code = '" + data.txn_code + "' " +
      ",amount = '" + data.amount + "',quantity = '" + data.quantity + "' ,id_type = '" + data.id_type + "',id_no = '" + data.id_no + "',photo_id = '" + data.photo_id + "',photo_yourself = '" + data.photo_yourself + "',sender_acc_no = '" + data.sender_acc_no + "',receiver_acc_no = '" + data.receiver_acc_no + "',tac_code = '" + data.tac_code + "',status = '" + data.status + "' WHERE user_id = '" + data.user_id + "' AND txn_date = '" + data.txn_date + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//get ewallet txn (specific)
Ewallet.getEwlTxnS = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT user_id,txn_date,ewallet_acc_no,txn_code,amount,quantity,id_type,id_no,photo_id,photo_yourself,sender_acc_no,receiver_acc_no,tac_code,status,created_by,created_date FROM ewl_transaction WHERE user_id = '" + data.user_id + "' AND txn_date = '" + data.txn_date + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        if (ress[0] || !ress[0] == undefined) {
          if (ress[0].photo_id || !ress[0].photo_id === undefined) {
            //convert buffer to string 
            var textChunk1 = ress[0].photo_id.toString('utf8');
            ress[0].photo_id = textChunk1;
          }

          if (ress[0].photo_yourself || !ress[0].photo_yourself === undefined) {
            //convert buffer to string 
            var textChunk2 = ress[0].photo_yourself.toString('utf8');
            ress[0].photo_yourself = textChunk2;
          }

          result(null, ress);
        } else {
          result(null, ress);
        }
      }
    });
  });
}

//get ewallet txn (by user all)
Ewallet.getEwlTxnAll = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT user_id,txn_date,ewallet_acc_no,txn_code,amount,quantity,id_type,id_no,photo_id,photo_yourself,sender_acc_no,receiver_acc_no,tac_code,status,created_by,created_date FROM ewl_transaction WHERE user_id = '" + data.user_id + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        for (var i = 0; i < ress.length; i++) {
          if (ress[i] || !ress[i] == undefined) {
            if (ress[i].photo_id || !ress[i].photo_id === undefined) {
              //convert buffer to string 
              var textChunk1 = ress[i].photo_id.toString('utf8');
              ress[i].photo_id = textChunk1;
            }

            if (ress[i].photo_yourself || !ress[i].photo_yourself === undefined) {
              //convert buffer to string 
              var textChunk2 = ress[i].photo_yourself.toString('utf8');
              ress[i].photo_yourself = textChunk2;
            }
          }
        }
        result(null, ress);
      }
    });
  });
}

//insert ewallet account
Ewallet.insertEwlAcc = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "INSERT INTO ewl_account(user_id,ewallet_acc_no,bank_acc_no,credit_card_no,available_amt,freeze_amt,float_amt,currency_cd,status,created_by,created_date) VALUES" +
      "('" + data.user_id + "','" + data.ewallet_acc_no + "','" + data.bank_acc_no + "','" + data.credit_card_no + "','" + data.available_amt + "','" + data.freeze_amt + "','" + data.float_amt + "','" + data.currency_cd + "','" + data.status + "','" + data.create_by + "','" + data.created_date + "')";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//update ewallet account
Ewallet.updateEwlAcc = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "UPDATE ewl_account SET ewallet_acc_no = '" + data.ewallet_acc_no + "',bank_acc_no = '" + data.bank_acc_no + "',credit_card_no = '" + data.credit_card_no + "',available_amt = '" + data.available_amt + "',freeze_amt = '" + data.freeze_amt + "',float_amt = '" + data.float_amt + "',currency_cd = '" + data.currency_cd + "',status = '" + data.status + "' WHERE user_id = '" + data.user_id + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//get ewallet account
Ewallet.getEwlAcc = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT user_id,ewallet_acc_no,bank_acc_no,credit_card_no,available_amt,freeze_amt,float_amt,currency_cd,status FROM ewl_account WHERE user_id = '" + data.user_id + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//get ewallet account with ewallet acc no
Ewallet.getEwlAcc1 = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT user_id,ewallet_acc_no,bank_acc_no,credit_card_no,available_amt,freeze_amt,float_amt,currency_cd,status FROM ewl_account WHERE ewallet_acc_no = '" + data.ewallet_acc_no + "'";
    con.query(sql, function (errs, ress) {
      console.log(data.ewallet_acc_no)
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//insert ewl_reload_pin
Ewallet.insertReloadPin = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "INSERT INTO ewl_reload_pin (pin_number,wallet_acc_no,txn_date,status,created_by,created_date) VALUES('" + data.pin_number + "','" + data.wallet_acc_no + "','" + data.txn_date + "','" + data.status + "','" + data.created_by + "','" + data.created_date + "')";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//update ewl_reload_pin
Ewallet.updateReloadPin = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "UPDATE ewl_reload_pin SET wallet_acc_no = '" + data.wallet_acc_no + "',txn_date='" + data.txn_date + "',status = '" + data.status + "',created_by = '" + data.created_by + "',created_date = '" + data.created_date + "' WHERE pin_number ='" + data.pin_number + "'";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        result(null, ress);
      }
    });
  });
}

//get ewallet txn (specific date range)
Ewallet.getEwlTxnDR = function (data, result) {
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    var sql = "SELECT user_id,txn_date,ewallet_acc_no,txn_code,amount,quantity,id_type,id_no,photo_id,photo_yourself,sender_acc_no,receiver_acc_no,tac_code,status,created_by,created_date FROM ewl_transaction WHERE user_id = '" + data.user_id + "' AND (txn_date >= '" + data.date_from + "' AND txn_date <= '" + data.date_to + "')";
    con.query(sql, function (errs, ress) {
      if (errs) {
        con.destroy();
        result(errs, null);
      } else {
        con.destroy();
        for (var i = 0; i < ress.length; i++) {
          if (ress[i] || !ress[i] == undefined) {
            if (ress[i].photo_id || !ress[i].photo_id === undefined) {
              //convert buffer to string 
              var textChunk1 = ress[i].photo_id.toString('utf8');
              ress[i].photo_id = textChunk1;
            }

            if (ress[i].photo_yourself || !ress[i].photo_yourself === undefined) {
              //convert buffer to string 
              var textChunk2 = ress[i].photo_yourself.toString('utf8');
              ress[i].photo_yourself = textChunk2;
            }
          }
        }
        result(null, ress);
      }
    });
  });
}
module.exports = Ewallet;