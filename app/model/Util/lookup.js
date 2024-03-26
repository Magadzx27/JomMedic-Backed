'use strict';
var pool = require('../../../config/connV2');

var LOOK = function(look) {
};

//get lookup all
LOOK.getLookUp = function(data,result){
    pool.getConnection(function(err, con) {
      if (err) throw err; // not connected!
      var sql = "SELECT  master_reference_code,detail_reference_code,description,priority_indicator,status FROM adm_lookup_detail WHERE master_reference_code = '"+data.master_reference_code+"' AND hfc_cd = '"+data.hfc_cd+"";
      con.query(sql, function(errs, ress) {
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

  module.exports = LOOK;