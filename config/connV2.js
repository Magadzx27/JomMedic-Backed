
var mysql = require('mysql');
require('dotenv').config();
var pool = mysql.createPool({
  connectionLimit: 100,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'emedica',
  multipleStatements: true,
  dateStrings: true,
});
module.exports = pool;
