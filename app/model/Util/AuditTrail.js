'use strict';
var pool = require('../../../config/connV2');

var AUT = function(aut) {
    this.tstamp = aut.tstamp;
    this.txn_cd = aut.txn_cd;
    this.id = aut.id;
  };

  AUT.create = function(newData, result) {
    pool.getConnection(function(err, con) {
      if (err) throw err; // not connected!
      con.query('INSERT INTO audit_trail (id,tstamp,txn_cd,activity,created_by,created_date) VALUES (?,?,?,?,?,?)',
     [newData.id,newData.tstamp,newData.txn_cd,newData.activity,newData.created_by,newData.tstamp ], function(err, res) {
      if (err) {
        con.destroy();
        result(err, null);
      } else {
        con.destroy();
        result(null, res);
      }
    });
    });
  };

  module.exports = AUT;