// 'use strict';

var pool = require('../../config/connV2');
var md5 = require('md5');
const fs = require("fs");

var customerModel = function () {
};


customerModel.signUp = function (ewalletId, name, email, password, customerId, icPassportNo, phoneNo, question,
    answer, picture, result) {

    var sql = "BEGIN; " +
        "SELECT COUNT(email) INTO @exist FROM jlk_user_profile WHERE email = ?; " +
        "INSERT INTO jlk_users (user_id, user_name, password, question, answer, id_category_cd, user_type, user_category) " +
        "SELECT ?, ?, ?, ?, ?, '2', '6', '2' WHERE NOT @exist; " +
        "INSERT INTO jlk_customer_acc (customer_id, user_id) " +
        "SELECT ?, ? WHERE NOT @exist; " +
        "INSERT INTO jlk_user_profile (user_id, name, id_number, mobile_no, picture, email) " +
        "SELECT ?, ?, ?, ?, ?, ? WHERE NOT @exist;  " +
        "INSERT INTO ewl_account (user_id, ewallet_acc_no, available_amt, freeze_amt, float_amt,currency_cd, status) " +
        "SELECT ?, ?, 0, 0, 0, '001', '001' WHERE NOT @exist; " +
        "COMMIT;";
    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [email, email, email, md5(password), question, answer, customerId, email, email, name,
            icPassportNo, phoneNo, picture, email, email, ewalletId], function (err, res) {
                if (err) {
                    con.destroy();
                    result(err, null);
                }
                else {
                    con.release();
                    if (res[2].affectedRows == 1 && res[3].affectedRows == 1 && res[4].affectedRows == 1 && res[5].affectedRows == 1) {
                        result(null, { result: true, value: 'Sign up successfully' });
                    }
                    else if (res[2].affectedRows == 0 && res[3].affectedRows == 0 && res[4].affectedRows == 0) {
                        result(null, { result: false, value: 'Email has been used' });
                    }
                    else {
                        result(null, { result: false, value: 'Fail to create account' });
                    }
                }
            });
    });

};

customerModel.userType = function (email, result) {
    var sql = "SELECT user_type FROM jlk_users WHERE user_id = ?;";
    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [email], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.length == 1) {
                    result(null, { result: true, data: res });
                }
                else {
                    result(null, { result: false, value: 'Invalid Email' });
                }

            }
        });
    });
};

customerModel.login = function (email, password, result) {
    console.log("hello magd im working")
    var sql = "BEGIN; " +
        "SELECT c.customer_id, u.user_type " +
        "FROM jlk_customer_acc c " +
        "INNER JOIN jlk_users u " +
        "ON c.user_id=u.user_id " +
        "WHERE BINARY u.user_name=? AND BINARY u.password =?; " +
        "UPDATE jlk_users " +
        "SET login_status='true' " +
        "WHERE BINARY user_name=? AND BINARY password =?; " +
        "COMMIT;";


    pool.getConnection(function (err, con) {

        if (err) throw err;
        con.query(sql, [email, md5(password), email, md5(password)], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[1].length == 1 && res[2].affectedRows == 1) {
                    result(null, { result: true, data: res[1] });
                }
                else {
                    result(null, { result: false, value: 'Invalid Email or Password' });
                }

            }
        });
    });

};

customerModel.forgetPassword = function (email, result) {
    var sql = "SELECT question from jlk_users WHERE user_name=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [email], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.length == 1) {
                    result(null, { result: true, data: res });
                }
                else {
                    result(null, { result: false, value: 'The email address does not exist' });
                }

            }
        });
    });

};

customerModel.resetPassword = function (email, answer, randomPass, result) {
    var sql = "UPDATE jlk_users SET password=? WHERE user_name =? AND answer=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [md5(randomPass), email, answer], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.affectedRows == 1) {
                    result(null, { result: true });
                }
                else {
                    result(null, { result: false, value: 'Incorrect secret answer' });
                }

            }
        });
    });

};

customerModel.getState = function (result) {
    var sql = "SELECT DISTINCT Description FROM adm_lookup_detail WHERE Master_Reference_code='0002'"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

}

customerModel.map = function (result) {

    var sql = "SELECT DISTINCT hfc_name, longitude, latitude, CONCAT(address1, ', ', address2, ', ', address3) AS address " +
        "FROM jlk_health_facility";
    // var sql = "SELECT tenant_name, longtitude, latitude, description, " +
    //     "CONCAT(tenant_address1, ', ', tenant_address2, ', ', tenant_address3) AS address FROM jlk_tenant";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });
};

customerModel.doctor = function (result) {

    // var sql = "SELECT t.tenant_id, t.tenant_name, t.tenant_state_cd,  t.longtitude, t.latitude, q.field_study, u.picture " +
    //     "FROM jlk_tenant t INNER JOIN jlk_qualification q ON t.tenant_id = q.tenant_id " +
    //     "INNER JOIN jlk_user_profile u ON t.user_id = u.user_id " +
    //     "ORDER BY q.field_study";

    var sql = "SELECT t.tenant_id, t.tenant_name, t.tenant_state_cd, t.tenant_district_cd, t.status, t.longtitude, t.latitude, GROUP_CONCAT(s.specialty_cd) AS specialty_cd, u.picture " +
        "FROM jlk_tenant t INNER JOIN jlk_jomedic_specialty s ON t.tenant_id = s.tenant_id  " +
        "INNER JOIN jlk_user_profile u ON t.user_id = u.user_id " +
        "GROUP BY t.tenant_id " +
        "ORDER BY s.specialty_cd";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });
};

customerModel.healthcare = function (result) {

    // var sql = "SELECT tenant_id, tenant_name, tenant_state_cd, longtitude, latitude, office_photo FROM jlk_tenant;  ";

    var sql = "SELECT DISTINCT hfc_name, hfc_cd, state_cd, district_cd, longitude, latitude, logo " +
        "FROM jlk_health_facility";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });
};

customerModel.healthcareDetail = function (HealthcareId, result) {

    var sql = "BEGIN; " +
        "SELECT hfc_name, longitude, latitude, telephone_no, contact_person, CONCAT(address1, ', ', address2, ', ', address3) AS address,  " +
        "DATE_FORMAT(established_date, '%d %M %Y') AS established_date, director_name, email, fax_no " +
        "FROM jlk_health_facility WHERE hfc_cd = ? ; " +
        "SELECT AVG(rating) AS rating, COUNT(rating) AS review_count FROM jlk_feedback " +
        "WHERE feedback_to IN (SELECT tenant_id FROM jlk_health_facility WHERE hfc_cd = ?); " +
        "COMMIT; "

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [HealthcareId, HealthcareId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.healthcareDoctor = function (HealthcareId, result) {

    // var sql = "SELECT t.tenant_id, t.tenant_name, t.tenant_state_cd, q.field_study, u.picture " +
    //     "FROM jlk_tenant t INNER JOIN jlk_qualification q ON t.tenant_id = q.tenant_id " +
    //     "INNER JOIN jlk_health_facility h ON t.tenant_id = h.tenant_id " +
    //     "INNER JOIN jlk_user_profile u ON t.user_id=u.user_id " +
    //     "WHERE h.hfc_cd=? " +
    //     "ORDER BY q.field_study";

    var sql = "SELECT t.tenant_id, t.tenant_name, t.tenant_state_cd, GROUP_CONCAT(s.specialty_cd) AS specialty_cd, u.picture " +
        "FROM jlk_tenant t INNER JOIN jlk_jomedic_specialty s ON t.tenant_id = s.tenant_id " +
        "INNER JOIN jlk_health_facility h ON t.tenant_id = h.tenant_id " +
        "INNER JOIN jlk_user_profile u ON t.user_id = u.user_id " +
        "WHERE h.hfc_cd=? " +
        "GROUP BY t.tenant_id " +
        "ORDER BY s.specialty_cd";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [HealthcareId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.doctorDetail = function (DoctorId, CustomerId, result) {
    var sql = "BEGIN; " +
        "SELECT t.tenant_id, t.tenant_name, t.status, q.qualification_cd, GROUP_CONCAT(s.specialty_cd) AS specialty_cd, q.university_name, " +
        "EXTRACT(YEAR FROM q.graduation_year) AS graduation_year, (SELECT price FROM jlk_package WHERE service_type='J12101') AS chat, " +
        "(SELECT price FROM jlk_package WHERE service_type='J12100') AS video, h.hfc_name, h.longitude, h.latitude, " +
        "CONCAT(h.address1, ', ', h.address2, ', ', h.address3) AS address " +
        "FROM jlk_tenant t INNER JOIN jlk_qualification q ON t.tenant_id = q.tenant_id " +
        "INNER JOIN jlk_jomedic_specialty s ON t.tenant_id = s.tenant_id " +
        "LEFT JOIN jlk_health_facility h ON h.tenant_id = t.tenant_id " +
        "WHERE t.tenant_id = ? ;" +
        "SELECT DATE_FORMAT(start_date, '%d / %m / %Y') AS start_date, DATE_FORMAT(start_date, '%a') AS week, start_date AS sort," +
        "DATE_FORMAT(start_time, '%H:%i') AS start_time, DATE_FORMAT(end_time, '%H:%i') AS end_time, status, " +
        "quota FROM pms_duty_roster WHERE hfc_cd=? AND start_date>=CURDATE() + INTERVAL 1 DAY ORDER BY sort LIMIT 7;" +
        // "SELECT available_amt FROM ewl_account WHERE user_id=(SELECT user_id FROM jlk_customer_acc WHERE customer_id=?);"+
        "COMMIT;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [DoctorId, DoctorId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.getWallet = function (CustomerId, result) {
    var sql = "SELECT user_id FROM jlk_customer_acc WHERE customer_id=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                sql = "SELECT available_amt FROM ewl_account WHERE user_id=?";
                pool.getConnection(function (err, con) {
                    if (err) throw err;
                    con.query(sql, [res[0].user_id], function (err, res) {
                        if (err) {
                            con.destroy();
                            result(err, null);
                        }
                        else {
                            con.release();
                            result(null, { result: true, data: res });
                        }
                    });
                });
            }
        });
    });

};

customerModel.createChat = function (CustomerId, DoctorId, OrderNo, result) {
    console.log("i here in create chat ttt", OrderNo);
    var sql = "BEGIN; " +

        "SET @active=(SELECT COUNT(m.user_id) " +
        "FROM jlk_message_queue m INNER JOIN jlk_customer_acc c ON m.user_id=c.user_id " +
        "WHERE c.customer_id=? AND (m.order_status='active' or m.order_status='pending') AND m.receiver_id=? AND m.txn_code='CHAT');" +
        "SET @user_id=(SELECT user_id FROM jlk_customer_acc WHERE customer_id=?);" +
        "INSERT INTO jlk_message_queue (user_id, txn_date, order_no, txn_code, order_date, " +

        "sender_id, receiver_id, order_priority, order_status) " +
        "SELECT @user_id, CONVERT_TZ(NOW(), '+08:00', '+8:00'), ?, 'CHAT', CONVERT_TZ(NOW(), '+08:00', '+8:00'), @user_id, ?, 'tbc', 'pending' WHERE NOT @active; " +
        // "SELECT order_no, receiver_id FROM jlk_message_queue m " +
        // "INNER JOIN jlk_customer_acc c ON m.user_id = c.user_id " +
        // "WHERE c.customer_id=? AND m.order_status='active' AND AND m.txn_code='CHAT'receiver_id=? AND m.txn_code='CHAT';" +
        "COMMIT;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId, DoctorId, CustomerId, OrderNo, DoctorId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[3].affectedRows == 1) {
                    customerModel.makePayment(CustomerId, 1);
                    result(null, {
                        result: true, data: [
                            {
                                receiver_id: DoctorId,
                                order_no: OrderNo

                            }
                        ],
                        message: "Submit request success. Please wait for doctor to accept your chat request"
                    });
                }
                else {
                    result(null, {
                        result: true, data: [{
                            receiver_id: DoctorId,
                            order_no: OrderNo
                        }],
                        message: "You already submit the chat request."
                    });
                }


            }
        });
    });

};

customerModel.checkChat = function (CustomerId, result) {
    var sql = "BEGIN;" +
        "UPDATE jlk_message_queue m INNER JOIN jlk_customer_acc c ON m.user_id=c.user_id SET m.order_priority='viewed' " +
        "WHERE c.customer_id=? AND m.txn_code='CHAT' AND m.order_status='active' AND m.order_priority='tbc'; " +
        "UPDATE jlk_message_queue m INNER JOIN jlk_customer_acc c ON m.user_id=c.user_id SET m.order_priority='viewed' " +
        "WHERE c.customer_id=? AND m.txn_code='CHAT' AND m.order_status='reject' AND m.order_priority='tbc'; " +
        "COMMIT;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId, CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[1].affectedRows >= 1 && res[2].affectedRows >= 1) {
                    // customerModel.makePayment(CustomerId, 1);
                    result(null, { result: true, accept: true, reject: true });
                }
                else if (res[1].affectedRows == 0 && res[2].affectedRows >= 1) {
                    customerModel.makePayment(CustomerId, -5);
                    result(null, { result: true, accept: false, reject: true });
                }
                else if (res[1].affectedRows >= 1 && res[2].affectedRows == 0) {
                    // customerModel.makePayment(CustomerId, 1);
                    result(null, { result: true, accept: true, reject: false });
                }
                else {
                    result(null, { result: false });
                }

            }
        });
    });

};

customerModel.getChatMessage = function (OrderNo, result) {
    console.log("yes I am Here ", OrderNo);
    var sql = "BEGIN;" +
        "SELECT DATE_FORMAT(ch.message_id, '%H:%i') AS message_id, user_type, message FROM jlk_chat_history ch " +
        "INNER JOIN jlk_message_queue m ON ch.orders_no=m.order_no " +
        "WHERE ch.orders_no = ? AND m.order_status='active' ORDER BY ch.message_id;" +
        "SELECT order_status FROM jlk_message_queue WHERE order_no=?;" +
        "COMMIT;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo, OrderNo], function (err, res) {
            if (err) {

                con.destroy();
                result(err, null);
            }
            else {
                console.log(res);
                con.release();
                // result(null, {
                //     result: true, data: [{

                //         orders_no: OrderNo
                //     }],
                // });
                result(null, { result: true, data: res });
            }
        });
    });
};

customerModel.sendChatMessage = function (CustomerId, DoctorId, Message, OrderNo, result) {
    var sql = "INSERT INTO jlk_chat_history (orders_no, message_id, sender_id, receiver_id, message, user_type) " +
        "VALUES (?, CONVERT_TZ(NOW(), '+08:00', '+8:00'), (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?), ?, ?, 'customer') ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo, CustomerId, DoctorId, Message], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.affectedRows == 1) {
                    result(null, { result: true });
                    // result(null, {
                    //     result: true, data: [{

                    //         orders_no: OrderNo
                    //     }],
                    // });
                }
                else {
                    result(null, { result: false, value: 'Fail to send message' });
                }

            }
        });
    });
};

customerModel.endLiveChat = function (OrderNo, CustomerId, DoctorId, result) {
    var sql = "BEGIN; " +
        "UPDATE jlk_message_queue SET order_status = 'end' WHERE order_no=?; " +
        "INSERT INTO jlk_order_master (user_id, order_no, txn_date, txn_code) " +
        "VALUES ((SELECT user_id FROM jlk_customer_acc WHERE customer_id=?), ?, CONVERT_TZ(NOW(), '+00:00', '+08:00'), 'CHAT'); " +
        "INSERT INTO jlk_order_detail (order_no, txn_date, status, amount, service_type) " +
        "VALUES (?, CONVERT_TZ(NOW(), '+00:00', '+08:00'), 'done', (SELECT price FROM jlk_package WHERE service_type='J12101'), 'J12101'); " +
        "SELECT od.order_no, DATE_FORMAT(od.txn_date, '%d/%m/%Y %H:%i') AS txn_date, od.amount, od.item_desc, t.tenant_name, p.service_name " +
        "FROM jlk_order_detail od INNER JOIN jlk_message_queue m ON od.order_no=m.order_no " +
        "INNER JOIN jlk_tenant t ON m.receiver_id=t.tenant_id INNER JOIN jlk_package p ON od.service_type=p.service_type " +
        "WHERE od.order_no=? ;" +
        "COMMIT; ";
    // minus balance
    // "UPDATE ewl_account SET available_amt=available_amt-(SELECT price FROM jlk_package WHERE service_type='J12101') "+
    // "WHERE user_id = (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?);"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo, CustomerId, OrderNo, OrderNo, OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[1].affectedRows == 1 && res[2].affectedRows == 1 && res[3].affectedRows == 1) {
                    console.log(res[4], "heere res[4]")
                    result(null, { result: true, data: res[4] });
                }
                else {
                    result(null, { result: false, value: 'Fail to end chat' });
                }
            }
        });
    });

};

customerModel.chatEnded = function (OrderNo, result) {
    var sql = "SELECT od.order_no, DATE_FORMAT(od.txn_date, '%d/%m/%Y %H:%i') AS txn_date, od.amount, od.item_desc, t.tenant_name, p.service_name " +
        "FROM jlk_order_detail od INNER JOIN jlk_message_queue m ON od.order_no=m.order_no " +
        "INNER JOIN jlk_tenant t ON m.receiver_id=t.tenant_id INNER JOIN jlk_package p ON od.service_type=p.service_type " +
        "WHERE od.order_no=? ;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                // customerModel.makePayment(CustomerId, 1);
                result(null, { result: true, data: res });

            }
        });
    });

};

customerModel.createVideoCall = function (CustomerId, DoctorId, OrderNo, result) {

    var sql = "BEGIN; " +
        "SET @user_id = (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?); " +
        "INSERT INTO jlk_message_queue (user_id, txn_date, order_no, txn_code, order_date, " +
        "sender_id, receiver_id, order_priority, txn_data, order_status) " +
        "VALUES (@user_id, CONVERT_TZ(NOW(), '+00:00', '+08:00'), ?, 'VIDEO', CONVERT_TZ(NOW(), '+00:00', '+08:00'), @user_id, ?, ?, '[]', 'pending'); " +
        "COMMIT; ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId, OrderNo, DoctorId, 'tbd'], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[2].affectedRows == 1) {
                    result(null, { result: true, data: res });
                }
                else {
                    result(null, { result: false, value: 'Fail to start video call' });
                }

            }

        });
    });
};

customerModel.checkReject = function (OrderNo, result) {

    var sql = "SELECT order_status FROM jlk_message_queue WHERE order_no=? LIMIT 1";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.length == 1) {
                    result(null, { result: true, data: res });
                }
                else {
                    result(null, { result: false, value: 'Fail check video status' });
                }
            }

        });
    });
};

customerModel.cancelVideoCall = function (OrderNo, result) {

    var sql = "UPDATE jlk_message_queue SET order_status='cancelled' WHERE order_no=? ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.affectedRows >= 1) {
                    result(null, { result: true, data: res });
                }
                else {
                    result(null, { result: false, value: 'Fail to cancel video call' });
                }
            }

        });
    });
};

customerModel.videoCallEnd = function (CustomerId, ChatDuration, OrderNo, result) {

    var sql = "BEGIN; " +
        "SET @user_id:=(SELECT user_id FROM jlk_customer_acc WHERE customer_id=?); " +
        "UPDATE jlk_message_queue SET order_status='end' WHERE order_no=?; " +
        "INSERT INTO jlk_order_master (user_id, order_no, txn_date, txn_code) " +
        "VALUES (@user_id, ?, CONVERT_TZ(NOW(), '+00:00', '+08:00'), 'VIDEO'); " +
        "INSERT INTO jlk_order_detail (order_no, txn_date, item_desc, status, amount, service_type) " +
        "VALUES (?, CONVERT_TZ(NOW(), '+00:00', '+08:00'), ?, 'done', (SELECT price FROM jlk_package WHERE service_type='J12100' ), 'J12100'); " +
        "SELECT od.order_no, DATE_FORMAT(od.txn_date, '%d/%m/%Y %H:%i') AS txn_date, od.amount, od.item_desc, t.tenant_name, p.service_name " +
        "FROM jlk_order_detail od INNER JOIN jlk_message_queue m ON od.order_no=m.order_no " +
        "INNER JOIN jlk_tenant t ON m.receiver_id=t.tenant_id " +
        "INNER JOIN jlk_package p ON p.service_type = od.service_type " +
        "WHERE od.order_no=? ;" +
        "COMMIT;";

    // minus balance
    // "UPDATE ewl_account SET available_amt=available_amt-(SELECT price FROM jlk_package WHERE service_type='J12100') "+
    // "WHERE user_id = @user_id;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId, OrderNo, OrderNo, OrderNo, ChatDuration, OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                customerModel.makePayment(CustomerId, 5);
                if (res[2].affectedRows >= 1 && res[3].affectedRows == 1 && res[4].affectedRows == 1) {
                    result(null, { result: true, data: res[5] });
                }
                else {
                    result(null, { result: false, value: 'Fail to end video call' });
                }
            }

        });
    });
};

customerModel.makePayment = function (CustomerId, Amount) {
    var sql = "SELECT user_id FROM jlk_customer_acc WHERE customer_id=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                // result(err, null);
            }
            else {
                con.release();
                sql = "UPDATE ewl_account SET available_amt=available_amt-? WHERE user_id=?";
                pool.getConnection(function (err, con) {
                    if (err) throw err;
                    con.query(sql, [Amount, res[0].user_id], function (err, res) {
                        if (err) {
                            con.destroy();
                            // result(err, null);
                        }
                        else {
                            con.release();
                            // result(null, { result: true, data: res });
                        }
                    });
                });
            }
        });
    });

};

customerModel.makeAppointment = function (CustomerId, DoctorId, Date, Time, OrderNo, result) {

    var sql = "BEGIN;" +
        "SELECT COUNT(pmi_no) INTO @exist FROM pms_appointment WHERE pmi_no = (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?) " +
        "AND hfc_cd=? AND appointment_date=? AND status='active' ; " +
        "UPDATE pms_duty_roster SET quota=quota-1 WHERE hfc_cd=? AND start_date=? AND NOT @exist;" +
        "INSERT INTO pms_appointment (pmi_no, hfc_cd, appointment_date, start_time, txn_date, userid, episode_date, order_no, status) " +
        "SELECT (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?), ?, ?, ?, CONVERT_TZ(NOW(), '+00:00', '+08:00'), " +
        "(SELECT user_id FROM jlk_tenant WHERE tenant_id=?), ?, ?, 'active' WHERE NOT @exist;" +
        "COMMIT;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId, DoctorId, Date, DoctorId, Date, CustomerId, DoctorId, Date, Time, DoctorId, Time, OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[2].affectedRows == 1 && res[3].affectedRows == 1) {
                    result(null, { result: true });
                }
                else {
                    result(null, { result: false, value: 'You already make appointment at this time' });
                }

            }

        });
    });
};

customerModel.appointment = function (CustomerId, result) {

    var sql = "SELECT DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date, DATE_FORMAT(a.start_time, '%H:%i') AS start_time, " +
        "a.order_no, t.tenant_id, t.tenant_name, t.longtitude, t.latitude, CONCAT(t.tenant_address1, ', ', t.tenant_address2, ', ', t.tenant_address3) AS address " +
        "FROM pms_appointment a INNER JOIN jlk_tenant t ON a.hfc_cd=t.tenant_id " +
        "WHERE a.status='active' AND a.pmi_no=(SELECT user_id FROM jlk_customer_acc WHERE customer_id=?) " +
        "AND appointment_date >= CURDATE() ORDER BY appointment_date";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });

            }

        });
    });
};

customerModel.cancelAppointment = function (OrderNo, result) {

    var sql = "BEGIN;" +
        "SET @date=(SELECT appointment_date FROM pms_appointment WHERE order_no=?), " +
        "@tenant_id=(SELECT hfc_cd FROM pms_appointment WHERE order_no=?);" +
        "DELETE FROM pms_appointment WHERE order_no=?;" +
        "UPDATE pms_duty_roster SET quota=quota+1 WHERE hfc_cd=@tenant_id AND start_date=@date;" +
        "COMMIT;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo, OrderNo, OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res[2].affectedRows == 1 && res[3].affectedRows == 1) {
                    result(null, { result: true });
                }
                else {
                    result(null, { result: false, value: 'Fail to cancel appointment' });
                }


            }

        });
    });
};

customerModel.giveRating = function (CustomerId, DoctorId, OrderNo, Rating, Comment, result) {
    var sql = "INSERT INTO jlk_feedback (txn_date, orders_no, feedback_by, feedback_to, tenant_type, rating, comments) " +
        "VALUES (CONVERT_TZ(NOW(), '+00:00', '+08:00'), ?, (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?), ?, ?, ?, ?)";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo, CustomerId, DoctorId, '???', Rating, Comment], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                if (res.affectedRows == 1) {
                    result(null, { result: true });
                }
                else {
                    con.release();
                    result(null, { result: true, value: 'Fail to submit rating' });
                }
            }
        });
    });

};

customerModel.getGender = function (result) {
    var sql = "SELECT DISTINCT Description FROM adm_lookup_detail " +
        "WHERE Master_Reference_code='0041' AND (Detail_Reference_code='001' OR Detail_Reference_code='002' OR Detail_Reference_code='003')";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });
}

customerModel.updateProfile = function (CustomerId, Name, IcPassportNo, PhoneNo, Gender, DateOfBirth, AddressLine1,
    AddressLine2, AddressLine3, City, State, Picture, result) {
    var sql = "UPDATE jlk_user_profile p " +
        "INNER JOIN jlk_customer_acc c ON p.user_id = c.user_id " +
        "SET p.name=?, p.id_number=?, p.mobile_no=?, p.gender_cd=?, p.DOB=?, p.home_address1=?, p.home_address2=?, p.home_address3=?, " +
        "p.district=?, p.state=?, p.picture=? " +
        "WHERE c.customer_id=? ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [Name, IcPassportNo, PhoneNo, Gender, DateOfBirth, AddressLine1, AddressLine2, AddressLine3,
            City, State, Picture, CustomerId], function (err, res) {
                if (err) {
                    con.destroy();
                    result(err, null);
                }
                else {
                    con.release();
                    if (res.affectedRows == 1) {
                        result(null, { result: true });
                    }
                    else {
                        result(null, { result: false, value: 'Fail to update account' });
                    }
                }
            });
    });

};

customerModel.profile = function (CustomerId, result) {
    var sql = "SELECT name, id_number, mobile_no, gender_cd, DOB, home_address1, home_address2, home_address3, district, state, picture " +
        "FROM jlk_user_profile p INNER JOIN jlk_customer_acc c " +
        "ON p.user_id = c.user_id " +
        "WHERE c.customer_id=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });
};

customerModel.selfInfo = function (CustomerId, result) {
    var sql = "SELECT p.name, p.picture, AVG(f.rating) AS rating " +
        "FROM jlk_user_profile p INNER JOIN jlk_customer_acc c ON p.user_id = c.user_id " +
        "LEFT JOIN jlk_feedback f ON f.feedback_to = p.user_id " +
        "WHERE c.customer_id=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.getEmail = function (CustomerId, result) {
    var sql = "SELECT email FROM jlk_user_profile WHERE user_id=(SELECT user_id FROM jlk_customer_acc WHERE customer_id=?) ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.currentChat = function (CustomerId, result) {
    var sql = "SELECT m.order_no, t.tenant_id, t.tenant_name, p.picture, GROUP_CONCAT(s.specialty_cd) AS specialty_cd FROM jlk_message_queue m  " +
        "INNER JOIN jlk_customer_acc c ON m.user_id=c.user_id " +
        "INNER JOIN jlk_tenant t ON m.receiver_id=t.tenant_id " +
        "INNER JOIN jlk_user_profile p ON t.user_id=p.user_id " +
        "INNER JOIN jlk_jomedic_specialty s ON t.tenant_id = s.tenant_id " +
        "WHERE c.customer_id=? AND m.order_status='active' " +
        "GROUP BY t.tenant_id; ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.history = function (CustomerId, result) {
    var sql = "SELECT om.order_no, om.txn_date, p.service_name FROM jlk_order_master om " +
        "INNER JOIN jlk_order_detail od ON om.order_no = od.order_no " +
        "INNER JOIN jlk_customer_acc c ON om.user_id = c.user_id " +
        "INNER JOIN jlk_package p ON p.service_type = od.service_type " +
        "WHERE c.customer_id=? ORDER BY om.txn_date DESC ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.historyDetail = function (OrderNo, result) {
    var sql = "SELECT od.order_no, DATE_FORMAT(od.txn_date, '%d/%m/%Y %H:%i') AS txn_date, od.amount, od.item_desc, t.tenant_name, p.service_name " +
        "FROM jlk_order_detail od INNER JOIN jlk_message_queue m ON od.order_no=m.order_no " +
        "INNER JOIN jlk_tenant t ON m.receiver_id=t.tenant_id " +
        "INNER JOIN jlk_package p ON p.service_type = od.service_type " +
        "WHERE od.order_no=? ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [OrderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.changePassword = function (CustomerId, OldPassword, NewPassword, result) {
    var sql = "UPDATE jlk_users u INNER JOIN jlk_customer_acc c ON u.user_id=c.user_id " +
        "SET u.password=? WHERE c.customer_id=? AND u.password=?";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [md5(NewPassword), CustomerId, md5(OldPassword)], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.affectedRows == 1) {
                    result(null, { result: true });
                }
                else {
                    result(null, { result: false, value: 'Incorrect old password' });
                }

            }
        });
    });

};

customerModel.viewRating = function (CustomerId, result) {
    var sql = "SELECT f.txn_date, f.orders_no, f.rating, f.comments, p.name, p.picture " +
        "FROM jlk_feedback f INNER JOIN jlk_user_profile p ON f.feedback_by = p.user_id " +
        "WHERE f.feedback_to = (SELECT user_id FROM jlk_customer_acc WHERE customer_id=?) ORDER BY f.txn_date DESC;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });
};

customerModel.previousChat = function (CustomerId, result) {
    var sql = "SELECT c.orders_no, u.name, u.picture, s.specialty_cd, m.txn_date " +
        "FROM jlk_chat_history c INNER JOIN jlk_user_profile u ON c.receiver_id = u.user_id " +
        "INNER JOIN jlk_jomedic_specialty s ON s.tenant_id = c.receiver_id " +
        "INNER JOIN jlk_message_queue m ON m.order_no = c.orders_no " +
        "WHERE c.sender_id=(SELECT user_id FROM jlk_customer_acc WHERE customer_id=?) " +
        "GROUP BY c.orders_no ORDER BY m.txn_date DESC";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();

                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.chatHistory = function (orderNo, result) {
    console.log("CHATHISTORY")
    var sql = "SELECT DATE_FORMAT(message_id, '%H:%i') AS message_id, message, user_type " +
        "FROM jlk_chat_history " +
        "WHERE orders_no=? ORDER BY message_id";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [orderNo], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                console.log(res)
                con.release();
                result(null, { result: true, data: res });
            }
        });
    });

};

customerModel.logout = function (CustomerId, result) {
    var sql = "UPDATE jlk_users u " +
        "INNER JOIN jlk_customer_acc c ON c.user_id=u.user_id " +
        "SET login_status='false' " +
        "WHERE c.customer_id=? ";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [CustomerId], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                if (res.affectedRows == 1) {
                    result(null, { result: true });
                }
                else {
                    result(null, { result: false, value: 'Fail to logout' });
                }
            }
        });
    });

};


module.exports = customerModel;