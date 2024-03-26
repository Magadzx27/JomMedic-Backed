var pool = require('../../config/connV2');
var md5 = require('md5');

var Medpro = function (Medpro) {

}

//this for check duplication of id
Medpro.checkDuplicateID = function (userID, result) {
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
//insert jlk_users
Medpro.addUserID = function (users, result) {
  var sql;
  sql = "INSERT INTO jlk_users (user_id,user_name,title,password,question,answer,mother_name,user_status,login_status,id_category_cd,start_date,end_date,remote_logout_date,remote_count,user_type,user_category,user_classification_cd,status,room_no,created_by,created_date)" +
    "VALUES ('" + users.user_id + "','" + users.user_name + "','" + users.title + "','" + md5(users.password) + "','" + users.question + "','" + users.answer + "','" + users.mother_name + "','" + users.user_status + "','" + users.login_status + "','" + users.id_category + "','" + users.start_date + "','" + users.end_date + "','" + users.remote_logout_date + "','" + users.remote_count + "','" + users.user_type + "','" + users.user_category + "','" + users.user_classification_cd + "','" + users.status + "','" + users.room_no + "','" + users.created_by + "','" + users.created_date + "')";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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
//insert users profile
Medpro.addUserProfile = function (users, result) {
  var sql;
  sql = "INSERT INTO jlk_user_profile (user_id,title,name,gender_cd,nationality_cd,DOB,occupation_cd,home_address1,home_address2,home_address3,district,state,country,postcode,mobile_no,email,picture,id_img,created_by,created_date,id_type,id_number)" 
  +"VALUES('" + users.user_id + "','" + users.title + "','" + users.name + "','" + users.gender_cd + "','" + users.nationality_cd + "','" + users.DOB + "','" + users.occupation_cd + "','" + users.home_address1 + "','" + users.home_address2 + "','" + users.home_address3 + "','" + users.district + "','" + users.state + "','" + users.country + "','" + users.postcode + "','" + users.mobile_no + "','" + users.email + "','" + users.picture + "','" + users.id_img + "','" + users.created_by + "','" + users.created_date + "','"+users.id_type+"','"+users.id_number+"')";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//get user and user profile detail
Medpro.getUsers = function (userID, result) {
  var sql = "SELECT a.user_id,a.user_name,a.title,a.password,a.question,a.answer,a.mother_name,a.user_status,a.login_status,a.id_category_cd,a.start_date,a.end_date,a.remote_logout_date,a.remote_count,a.user_type,a.user_category,a.user_classification_cd,a.status,a.room_no,b.gender_cd,b.nationality_cd,b.DOB,b.occupation_cd,b.home_address1,b.home_address2,b.home_address3,b.district,b.state,b.country,b.postcode,b.mobile_no,b.email,b.picture,b.id_img,b.id_type,b.id_number" +
    " FROM jlk_users a JOIN jlk_user_profile b ON b.user_id = a.user_id WHERE a.user_id = ?";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, [userID], function (error, res) {
      if (error) {
        con.destroy();
        result(error, null);
      } else {
        con.destroy();
        if (res[0] || !res[0] == undefined) {

          var datetimer = new Date(res[0].DOB).toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"});
          datetimer =  new Date(datetimer);
          var newDatetimer = datetimer.getFullYear() + "-" + (datetimer.getMonth()+ 1) + "-"+datetimer.getDate();
          res[0].DOB = newDatetimer;
          //convert buffer to string 
          if (res[0].picture || !res[0].picture === undefined) {
            var textChunk = res[0].picture.toString('utf8');
            res[0].picture = textChunk;
          }
          result(null, res);
        } else if (!res[0] || res[0] == undefined) {
          result(null, res);
        }
      }
    });
  });
}

//update Users
Medpro.updateUser = function (users, result) {
  var sql;
  sql = "UPDATE jlk_users SET user_name = '" + users.user_name + "',title = '" + users.title + "',password = '" + md5(users.password) + "',question = '" + users.question + "',answer = '" + users.answer + "',mother_name = '" + users.mother_name + "',user_status = '" + users.user_status + "',login_status = '" + users.login_status + "',id_category_cd = '" + users.id_category + "',start_date = '" + users.start_date + "',end_date = '" + users.end_date + "',remote_logout_date = '" + users.remote_logout_date + "'," +
    "remote_count = '" + users.remote_count + "',user_type = '" + users.user_type + "',user_category = '" + users.user_category + "',user_classification_cd = '" + users.user_classification_cd + "',status = '" + users.status + "',room_no = '" + users.room_no + "' WHERE user_id = '" + users.user_id + "'";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//update user profile
Medpro.updateUserProfile = function (users, result) {
  var sql = "UPDATE jlk_user_profile SET title = '" + users.title + "',name = '" + users.name + "',gender_cd = '" + users.gender_cd + "',nationality_cd = '" + users.nationality_cd + "',DOB = '" + users.DOB + "',occupation_cd = '" + users.occupation_cd + "',home_address1 = '" + users.home_address1 + "',home_address2 = '" + users.home_address2 + "',home_address3 = '" + users.home_address3 + "',district = '" + users.district + "',state = '" + users.state + "',country = '" + users.country + "',postcode = '" + users.postcode + "',mobile_no = '" + users.mobile_no + "',email = '" + users.email + "',picture = '" + users.picture + "',id_img = '" + users.id_img + "' ,id_type = '"+users.id_type+"' , id_number = '"+users.id_number+"' WHERE user_id = '" + users.user_id + "' ";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//insert jlk tenant
Medpro.insertTenant = function (tenant, result) {
  var sql = "INSERT INTO jlk_tenant (tenant_id,user_id,tenant_name,tenant_type,director_name,tenant_address1,tenant_address2,tenant_address3,tenant_town_cd,tenant_district_cd,tenant_state_cd,tenant_country_cd,tenant_postcode,tenant_phone_no,tenant_email,package_type,start_date,end_date,status,organisation_name,longtitude,latitude,created_by,created_date) VALUES (" +
    "'" + tenant.tenant_id + "','" + tenant.user_id + "','" + tenant.tenant_name + "','" + tenant.tenant_type + "','" + tenant.director_name + "','" + tenant.tenant_address1 + "','" + tenant.tenant_address2 + "','" + tenant.tenant_address3 + "','" + tenant.tenant_town_cd + "','" + tenant.tenant_district_cd + "','" + tenant.tenant_state_cd + "','" + tenant.tenant_country_cd + "','" + tenant.tenant_postcode + "','" + tenant.tenant_phone_no + "','" + tenant.tenant_email + "','" + tenant.package_type + "','" + tenant.start_date + "','" + tenant.end_date + "','" + tenant.status + "','" + tenant.organisation_name + "','" + tenant.longitude + "','" + tenant.latitude + "','" + tenant.created_by + "','" + tenant.created_date + "')";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//update jlk tenant
Medpro.updateTenant = function (tenant, result) {
  var sql = "UPDATE jlk_tenant SET tenant_name = '" + tenant.tenant_name + "',director_name = '" + tenant.director_name + "',tenant_address1 = '" + tenant.tenant_address1 + "',tenant_address2 = '" + tenant.tenant_address2 + "',tenant_address3 = '" + tenant.tenant_address3 + "' " +
    ",tenant_town_cd = '" + tenant.tenant_town_cd + "',tenant_district_cd = '" + tenant.tenant_district_cd + "',tenant_state_cd = '" + tenant.tenant_state_cd + "',tenant_country_cd = '" + tenant.tenant_country_cd + "',tenant_postcode = '" + tenant.tenant_postcode + "',tenant_phone_no = '" + tenant.tenant_phone_no + "' " +
    ",tenant_email='" + tenant.tenant_email + "',package_type='" + tenant.package_type + "',start_date='" + tenant.start_date + "',end_date = '" + tenant.end_date + "',status = '" + tenant.status + "',organisation_name = '" + tenant.organisation_name + "',longtitude = '" + tenant.longitude + "',latitude = '" + tenant.latitude + "' WHERE tenant_id = '" + tenant.tenant_id + "' AND user_id = '" + tenant.user_id + "' ";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//select jlk tenant
Medpro.getTenant = function (tenant, result) {
  var sql = "SELECT tenant_id,user_id,tenant_name,tenant_type,director_name,tenant_address1,tenant_address2,tenant_address3,tenant_town_cd,tenant_district_cd,tenant_state_cd,tenant_country_cd,tenant_postcode,tenant_phone_no,tenant_email,package_type,start_date,end_date,status,organisation_name,longtitude,latitude,created_by,created_date "+
  "FROM jlk_tenant WHERE tenant_id = '"+tenant.tenant_id+"' AND tenant_type = '"+tenant.tenant_type+"'";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//insert jlk master
Medpro.insertMaster = function (data, result) {
  var sql = "INSERT INTO jlk_jomedic_master (tenant_id,tenant_type,hfc_type_cd,service_fee,deposit,discount,tax,BLC,APC,created_by,created_date) VALUES('" + data.tenant_id + "','" + data.tenant_type + "','" + data.hfc_type_cd + "','" + data.service_fee + "','" + data.deposit + "','" + data.discount + "','" + data.tax + "','" + data.BLC + "','" + data.APC + "','" + data.created_by + "','" + data.created_date + "')";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//update jlk master
Medpro.updateMaster = function (data, result) {
  var sql = "UPDATE jlk_jomedic_master SET hfc_type_cd = '" + data.hfc_type_cd + "',service_fee = '" + data.service_fee + "',deposit = '" + data.deposit + "',discount = '" + data.discount + "',tax = '" + data.tax + "',BLC = '" + data.BLC + "',APC = '" + data.APC + "' WHERE tenant_id = '" + data.tenant_id + "' AND tenant_type = '" + data.tenant_type + "' ";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//get jlk master
Medpro.getMaster = function (data, result) {
  var sql = "SELECT tenant_id,tenant_type,hfc_type_cd,service_fee,deposit,discount,tax,BLC,APC FROM jlk_jomedic_master WHERE tenant_id = '"+data.tenant_id+"' AND tenant_type = '"+data.tenant_type+"'";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
      if (err) {
        con.destroy();
        result(err, null);
      } else {
        con.destroy();
        if (res[0] || !res[0] == undefined) {
          //convert buffer to string 
          if (res[0].BLC || !res[0].BLC === undefined) {
            var textChunk = res[0].BLC.toString('utf8');
            res[0].BLC = textChunk;
          }

          if (res[0].APC || !res[0].APC === undefined) {
            var textChunk2 = res[0].APC.toString('utf8');
            res[0].APC = textChunk2;
          }
          result(null, res);
        } else if (!res[0] || res[0] == undefined) {
          result(null, res);
        }
      }
    });
  });
}

//insert jlk customer acc
Medpro.insertCustAcc = function (data, result) {
  var sql = "INSERT INTO jlk_customer_acc (customer_id,user_id,bank_acc_no,bank_name,bank_address1,bank_address2,bank_address3,district_cd,state_cd,gl_acc_cd,acc_type,status,created_by,created_date) " +
    "VALUES('" + data.customer_id + "','" + data.user_id + "','" + data.bank_acc_no + "','" + data.bank_name + "','" + data.bank_address1 + "','" + data.bank_address2 + "','" + data.bank_address3 + "','" + data.district_cd + "','" + data.state_cd + "','" + data.gl_acc_cd + "','" + data.acc_type + "','" + data.status + "','" + data.created_by + "','" + data.created_date + "')";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//update jlk customer acc
Medpro.updateCustAcc = function (data, result) {
  var sql = "UPDATE jlk_customer_acc SET bank_acc_no= '" + data.bank_acc_no + "',bank_name = '" + data.bank_name + "',bank_address1 = '" + data.bank_address1 + "',bank_address2 = '" + data.bank_address2 + "',bank_address3 = '" + data.bank_address3 + "',district_cd = '" + data.district_cd + "',state_cd = '" + data.state_cd + "',gl_acc_cd = '" + data.gl_acc_cd + "',acc_type = '" + data.acc_type + "',status = '" + data.status + "' WHERE customer_id = '" + data.customer_id + "' AND user_id = '" + data.user_id + "'";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//insert jlk qualification
Medpro.insertQualification = function (data, result) {
  var sql = "INSERT INTO jlk_qualification(tenant_id,qualification_cd,field_study,university_name,graduation_year,created_by,created_date) " +
    "VALUES('" + data.tenant_id + "','" + data.qualification_cd + "','" + data.field_study + "','" + data.university_name + "','" + data.graduation_year + "','" + data.created_by + "','" + data.created_date + "')";

  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//update jlk qualification
Medpro.updateQualification = function (data, result) {
  var sql = "UPDATE jlk_qualification SET university_name = '" + data.university_name + "',graduation_year = '" + data.graduation_year + "' WHERE tenant_id = '" + data.tenant_id + "' AND field_study = '" + data.field_study + "' AND qualification_cd = '" + data.qualification_cd + "' "; +

    pool.getConnection(function (err, con) {
      if (err) throw err; // not connected!
      con.query(sql, function (err, res) {
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

//get jlk qualification
Medpro.getQualification = function (data, result) {
  var sql = "SELECT tenant_id,qualification_cd,field_study,university_name,graduation_year FROM jlk_qualification WHERE tenant_id = '"+data.tenant_id+"' AND qualification_cd = '"+data.qualification_cd+"' AND field_study = '"+data.field_study+"'"; +
    pool.getConnection(function (err, con) {
      if (err) throw err; // not connected!
      con.query(sql, function (err, res) {
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


//insert jlk language
Medpro.insertLanguage = function (data, result) {
  var sql = "INSERT INTO jlk_language (tenant_id,language_cd,created_by,created_date) VALUES ('" + data.tenant_id + "','" + data.language_cd + "','" + data.created_by + "','" + data.created_date + "')";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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


//delete jlk language
Medpro.deleteLanguage = function (data, result) {
  var sql = "DELETE FROM jlk_language WHERE tenant_id = '" + data.tenant_id + "' AND language_cd = '" + data.language_cd + "' ";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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


//insert jlk specialty
Medpro.insertSpecialty = function (data, result) {
  var sql = "INSERT INTO jlk_jomedic_specialty (tenant_id,specialty_cd,status,created_by,created_date) VALUES ('" + data.tenant_id + "','" + data.specialty_cd + "','" + data.status + "','" + data.created_by + "','" + data.created_date + "')";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//get jlk specialty
Medpro.getSpecialty = function (data, result) {
  var sql = "SELECT tenant_id,specialty_cd,status FROM jlk_jomedic_specialty WHERE tenant_id = '"+data.tenant_id+"' AND specialty_cd = '"+data.specialty_cd+"' ";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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


//update jlk specialty
Medpro.updateSpecialty = function (data, result) {
  var sql = "UPDATE jlk_jomedic_specialty SET status = '" + data.status + "' WHERE tenant_id = '" + data.tenant_id + "' AND specialty_cd = '" + data.specialty_cd + "' ";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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


//insert jlk working day
Medpro.insertWorkingDay = function (data, result) {
  var sql = "INSERT INTO jlk_working_day (tenant_id,working_day,start_time,end_time,created_by,created_date) VALUES ('" + data.tenant_id + "','" + data.working_day + "','" + data.start_time + "','" + data.end_time + "','" + data.created_by + "','" + data.created_date + "')";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//insert jlk working day (Bulk)
Medpro.insertWorkingDayBulk = function (data, result) {
  var sql = "INSERT INTO jlk_working_day (tenant_id,working_day,start_time,end_time,created_by,created_date) VALUES ?";
  var x = [data];
  console.log(x);
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql,x, function (err, res) {
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

//update jlk working day
Medpro.updateWorkingDay = function (data, result) {
  var sql = "UPDATE jlk_working_day SET start_time = '" + data.start_time + "',end_time = '" + data.end_time + "' WHERE tenant_id = '" + data.tenant_id + "' AND working_day = '" + data.working_day + "'";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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

//get jlk working day
Medpro.getWorkingDay = function (data, result) {
  var sql = "SELECT tenant_id,working_day,start_time,end_time FROM jlk_working_day WHERE tenant_id = '"+data.tenant_id+"' AND working_day = '"+data.working_day+"' AND start_time = '"+data.start_time+"'";
  pool.getConnection(function (err, con) {
    if (err) throw err; // not connected!
    con.query(sql, function (err, res) {
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
module.exports = Medpro;