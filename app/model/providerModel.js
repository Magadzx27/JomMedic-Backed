'use strict';

// Import 
var pool = require('../../config/connV2');
var imageConverter = require('./Util/imageConverter')  // Image Converter utility
var md5 = require('md5')

var providerModel = function () {
}

// Login
providerModel.login = function (username, password, result) {
    var sql = "SELECT * FROM jlk_users WHERE user_name=? AND password=?";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, [username, password], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
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

};
// Signup
// providerModel.signUp = function (ewalletId, name, email, password, icPassportNo, phoneNo,picture, result) {

//     var sql = "BEGIN; " +
//         "SELECT COUNT(email) INTO @exist FROM jlk_user_profile WHERE email = ?; " +
//         "INSERT INTO jlk_users (user_id, user_name, password, id_category_cd, user_type, user_category) " +
//         "SELECT ?, ?, ?, '2', '2', '2' WHERE NOT @exist; " +
//         "INSERT INTO jlk_tenant (tenant_id, user_id,tenant_name,tenant_type,director_name,tenant_state_cd,tenant_country_cd,tenant_postcode,tenant_phone_no,tenant_email) " +
//         "SELECT ?, ? WHERE NOT @exist; " +
//         "INSERT INTO jlk_user_profile (user_id, name, id_number, mobile_no, picture, email) " +
//         "SELECT ?, ?, ?, ?, ?, ? WHERE NOT @exist;  " +
//         "INSERT INTO ewl_account (user_id, ewallet_acc_no, available_amt, freeze_amt, float_amt,currency_cd, status) " +
//         "SELECT ?, ?, 0, 0, 0, '001', '001' WHERE NOT @exist; " +
//         "COMMIT;";
//     pool.getConnection(function (err, con) {
//         if (err) throw err;
//         con.query(sql, [email, email, email, md5(password), question, answer, customerId, email, email, name,
//             icPassportNo, phoneNo, picture, email, email, ewalletId], function (err, res) {
//                 if (err) {
//                     con.destroy();
//                     result(err, null);
//                 }
//                 else {
//                     con.release();
//                     if (res[2].affectedRows == 1 && res[3].affectedRows == 1 && res[4].affectedRows == 1 && res[5].affectedRows == 1) {
//                         result(null, { result: true, value: 'Sign up successfully' });
//                     }
//                     else if (res[2].affectedRows == 0 && res[3].affectedRows == 0 && res[4].affectedRows == 0) {
//                         result(null, { result: false, value: 'Email has been used' });
//                     }
//                     else {
//                         result(null, { result: false, value: 'Fail to create account' });
//                     }
//                 }
//             });
//     });

// };
//check email exist not
providerModel.checkEmailAuth = function (username, result) {
    var sql;
    sql = "SELECT user_name FROM jlk_users WHERE user_id = ?";
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, [username], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "OK");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "EMAILXDE");
                }
            }
        });
    });
};

// Update Log Stat
providerModel.updateLogStat = function (id, status, result) {

    var sql = "UPDATE jlk_users SET login_status=? WHERE user_id=?"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [status, id], function (errss, resss) {
            if (errss) {
                con.destroy();
                result(errss, null);
            } else {
                con.destroy();
                result(null, resss);
            }

        });
    });
};

// Get User and User Profile Data
providerModel.getUserData = function (user_id, result) {

    var sql = "SELECT u.user_id, u.user_name, u.title, u.password, u.question, u.answer, u.mother_name, u.user_status, u.login_status, u.id_category_cd, u.start_date, u.end_date, u.remote_logout_date, u.remote_count, "
        + "u.user_type, u.user_category, u.user_classification_cd, u.status, u.room_no, up.name, up.id_type, up.id_number, up.gender_cd, up.nationality_cd, up.DOB, up.occupation_cd, up.home_address1, up.home_address2, "
        + "up.home_address3, up.district, up.state, up.country, up.postcode, up.mobile_no, up.email, up.picture, up.id_img FROM jlk_users u LEFT JOIN jlk_user_profile up ON u.user_id=up.user_id WHERE u.user_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, user_id, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();

                // Convert the blob to base64 string with img tag
                var imageUri = imageConverter.blobToBase64Img(res[0].picture)

                // Set the picture to image uri
                res[0].picture = imageUri

                result(null, res);
            }
        });
    });
}

// Change Account Password
providerModel.changePassword = function (UserId, OldPassword, NewPassword, result) {
    var sql = "UPDATE jlk_users SET password=? WHERE user_id=? AND password=?"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [md5(NewPassword), UserId, md5(OldPassword)], function (err, res) {
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

// Get the Email of the User
providerModel.getEmail = function (UserId, result) {
    var sql = "SELECT email FROM jlk_user_profile WHERE user_id=?;";

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, UserId, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            }
            else {
                con.release();
                result(null, res);
            }
        });
    });
};

// Update User Profile
providerModel.updateUserProfile = function (newData, result) {
    // Convert base64 image string to buffer
    var buffer = imageConverter.base64ToBlob(newData.picture)

    var sql = "UPDATE jlk_user_profile SET title=?,name=?,id_type=?,id_number=?,gender_cd=?,nationality_cd=?,DOB=?,occupation_cd=?,home_address1=?,home_address2=?,home_address3=?,district=?,state=?,country=?,postcode=?,mobile_no=?,email=?,picture=?,id_img=? WHERE user_id=?;"

    pool.getConnection(function (errs, con) {
        console.log("I am here update User Profile");
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.title, newData.name, newData.id_type, newData.id_number, newData.gender, newData.nationality_cd,
        newData.DOB, newData.occupation_cd, newData.home_address1, newData.home_address2, newData.home_address3, newData.district,
        newData.state, newData.country, newData.postcode, newData.mobile_no, newData.email, buffer, newData.id_img,
        newData.user_id],
            function (errss, resss) {
                if (errss) {
                    console.log(errss)
                    con.destroy();
                    result(errss, null);
                } else {
                    con.destroy();
                    result(null, resss);
                }
            });
    });
}

// Get Tenant Data
providerModel.getTenant = function (user_id, tenant_type, result) {
    var sql = "SELECT * FROM jlk_tenant WHERE user_id=? AND tenant_type=?"
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [user_id, tenant_type], function (err, res) {
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

// Set Tenant Status to Available
providerModel.updateTenantAvailable = function (tenant_id, result) {
    var sql = "UPDATE jlk_tenant SET status='Available' WHERE tenant_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, tenant_id, function (err, res) {
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

// Set Tenant Status to not available 
providerModel.updateTenantNotAvailable = function (tenant_id, result) {
    var sql = "UPDATE jlk_tenant SET status='Not Available' WHERE tenant_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, tenant_id, function (err, res) {
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

// Set Tenant Status to Busy
providerModel.updateTenantBusy = function (tenant_id, result) {
    var sql = "UPDATE jlk_tenant SET status='Busy' WHERE tenant_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, tenant_id, function (err, res) {
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


// Set Tenant Status to Offline
providerModel.updateTenantOffline = function (tenant_id, result) {
    var sql = "UPDATE jlk_tenant SET status='Offline' WHERE tenant_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, tenant_id, function (err, res) {
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

// Get package price
providerModel.getPrice = function (service_type, result) {
    console.log("here")
    var sql = "SELECT price FROM jlk_package WHERE service_type=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs;
        con.query(sql, service_type, function (err, res) {
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

// Insert Order Master
providerModel.insertOrder = function (newData, tstamp, result) {

    var sql = "INSERT INTO jlk_order_master (user_id, order_no, txn_date, txn_code, status, created_by, created_date) VALUES (?,?,?,?,?,?,?)"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.user_id, newData.order_no, tstamp, newData.txn_code, newData.status, newData.created_by, tstamp], function (err, res) {
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

// Get Order Master
providerModel.getOrder = function (user_id, order_no, result) {
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query('SELECT * FROM jlk_order_master WHERE user_id = ? AND order_no = ?', [user_id, order_no], function (err, res) {
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

// Update Order Master
providerModel.updateOrder = function (newData, tstamp, result) {

    var sql = "UPDATE jlk_order_master SET txn_date=?,txn_code=?,status=? WHERE order_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [tstamp, newData.txn_code, newData.status, newData.order_no], function (err, res) {
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

// Update Order Master Status
providerModel.updateOrderStatus = function (status, order_no, result) {
    var sql = "UPDATE jlk_order_master SET status = '" + status + "' WHERE order_no = '" + order_no + "' ";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
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
};

// Delete Order Master 
providerModel.deleteOrder = function (order_no, user_id, result) {
    var sql = "DELETE FROM jlk_order_master WHERE order_no='" + order_no + "' AND user_id='" + user_id + "'";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
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
};


// Check Duplicate Order Master
providerModel.checkDuplicateOrder = function (order_no, result) {
    var sql = "SELECT order_no FROM jlk_order_master WHERE order_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, order_no, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert Order Detail
providerModel.insertOrderDetail = function (newData, tstamp, result) {

    var sql = "INSERT INTO jlk_order_detail (order_no, txn_date, item_cd, item_desc, amount, quantity, deposit, discount, service_type, "
        + "status, created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?);"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.order_no, tstamp, newData.item_cd, newData.item_desc, newData.amount, newData.quantity, newData.deposit, newData.discount,
            newData.service_type, newData.status, newData.created_by, tstamp], function (err, res) {
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


// Get Order Detail
providerModel.getOrderDetail = function (order_no, result) {
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query('SELECT * FROM jlk_order_detail WHERE order_no=?;', order_no, function (err, res) {
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

// Update Order Detail
providerModel.updateOrderDetail = function (newData, tstamp, result) {
    var sql = "UPDATE jlk_order_detail SET txn_date=?, item_cd=?, item_desc=?, amount=?, quantity=?, deposit=?, discount=?, "
        + "service_type=?, status=? WHERE order_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [tstamp, newData.item_cd, newData.item_desc, newData.amount, newData.quantity, newData.deposit, newData.discount,
                newData.service_type, newData.status, newData.order_no], function (err, res) {
                    if (err) {
                        console.log(err)
                        con.destroy();
                        result(err, null);
                    } else {
                        con.destroy();
                        result(null, res);
                    }
                });
    });

}

// Delete Order Details 
providerModel.deleteOrderDetail = function (order_no, txn_date, result) {
    var sql = "DELETE FROM jlk_order_detail WHERE order_no='" + order_no + "' AND txn_date='" + txn_date + "'";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
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
};

// Check Duplicate Order Detail
providerModel.checkDuplicateOrderDetail = function (order_no, result) {
    var sql = "SELECT order_no FROM jlk_order_detail WHERE order_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, order_no, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Get Customers Data for a tenant, order status ended
providerModel.getCustomers = function (tenant_id, result) {

    var sql = "SELECT user_id, name, DOB, mobile_no, email, nationality_cd, home_address1, home_address2, home_address3, district, state, country, picture " +
        "FROM jlk_user_profile WHERE user_id IN (SELECT DISTINCT sender_id FROM jlk_message_queue WHERE receiver_id=? AND order_status='end') " +
        "ORDER BY name ASC"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, tenant_id, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                res.forEach(element => {
                    // Convert the blob picture to based 64 string
                    var base64 = imageConverter.blobToBase64Img(element.picture)

                    // Set the base64 string as picture
                    element.picture = base64
                });

                con.destroy();
                result(null, res);
            }
        });
    });
};

// Get all Chat Records for a Customer
providerModel.getChatHistory = function (user_id, tenant_id, result) {

    var sql = "SELECT * FROM jlk_message_queue WHERE order_status='end' AND txn_code='CHAT' AND receiver_id=? AND sender_id=? ORDER BY txn_date DESC;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [tenant_id, user_id], function (err, res) {
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

// Get all Video Call Records for a Customer
providerModel.getCallHistory = function (user_id, tenant_id, result) {

    var sql = "SELECT * FROM jlk_message_queue WHERE order_status='end' AND txn_code='VIDEO' AND receiver_id=? AND sender_id=? ORDER BY txn_date DESC;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [tenant_id, user_id], function (err, res) {
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

// Get Order Queue of a tenant
providerModel.getOrderQueue = function (tenant_id, result) {

    var sql = "SELECT up.name, up.DOB, up.district, up.state, up.country, up.nationality_cd, up.picture, up.id_number, up.email, up.mobile_no, mq.txn_code, mq.order_no, mq.txn_date, up.user_id FROM jlk_message_queue mq " +
        "LEFT JOIN jlk_user_profile up ON mq.user_id=up.user_id WHERE mq.receiver_id=? AND (mq.order_status='pending' OR mq.order_status='active') ORDER BY mq.order_no ASC;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, tenant_id, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                res.forEach(element => {
                    // Convert the blob picture to based 64 string
                    var base64 = imageConverter.blobToBase64Img(element.picture)

                    // Set the base64 string as picture
                    element.picture = base64
                });

                con.destroy();
                result(null, res);
            }
        });
    });
};

providerModel.updateOrderActive = function (order_no, result) {
    var sql = "UPDATE jlk_message_queue SET order_status='active' WHERE order_no=?"
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, order_no, function (err, res) {
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

providerModel.updateOrderReject = function (order_no, result) {
    var sql = "UPDATE jlk_message_queue SET order_status='reject' WHERE order_no=?"
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, order_no, function (err, res) {
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

providerModel.updateOrderEnd = function (order_no, result) {
    var sql = "UPDATE jlk_message_queue SET order_status='end' WHERE order_no=?"
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, order_no, function (err, res) {
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

// Get Data of a message queue
providerModel.getMessageQueueData = function (order_no, result) {

    var sql = "SELECT * FROM jlk_message_queue WHERE order_no=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, order_no, function (err, res) {
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

providerModel.getMessageQueueData = function (order_no, result) {

    var sql = "SELECT * FROM jlk_message_queue WHERE order_no=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, order_no, function (err, res) {
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

// Select pending message queue data only 
providerModel.getMessageQueueDataPending = function (order_no, result) {

    var sql = "SELECT * FROM jlk_message_queue WHERE order_no=? AND order_status='pending';"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, order_no, function (err, res) {
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

// Get all Chat Records for a Customer with final message
providerModel.getChatHistoryWithMessage = function (user_id, tenant_id, result) {

    var sql = "SELECT mq.user_id,mq.txn_date,mq.order_no,mq.txn_code,mq.order_date,mq.sender_id,mq.receiver_id,mq.order_priority,mq.order_status,c.message "
        + "FROM jlk_message_queue mq LEFT JOIN ("
        + "SELECT order_no, message_id, message FROM jlk_chat_history AS a "
        + "WHERE message_id = (SELECT MAX(message_id) FROM jlk_chat_history AS b WHERE a.order_no = b.order_no)) c "
        + "ON mq.order_no=c.order_no WHERE order_status='end' AND txn_code='CHAT' AND receiver_id=? AND sender_id=? ORDER BY txn_date DESC;";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [tenant_id, user_id], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                result(null, { result: true, data: res });
            }
        });
    });
};

// Insert Chat
providerModel.insertChat = function (newData, tstamp, result) {
    pool.getConnection(function (err, con) {
        var sql = 'INSERT INTO jlk_chat_history (orders_no, message_id, order_date, sender_id, receiver_id, message, user_type, created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?);'

        if (err) throw err; // not connected!
        con.query(sql,
            [newData.order_no, tstamp, newData.order_date, newData.sender_id, newData.receiver_id, newData.message, newData.user_type, newData.created_by, tstamp], function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Get Chat History
providerModel.getChat = function (order_no, result) {

    var sql = "SELECT * FROM jlk_chat_history WHERE orders_no=?;"

    pool.getConnection(function (errs, con) {
        console.log("heere in chat")
        if (errs) throw errs; // not connected!
        con.query(sql, order_no, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                console.log("heere in chat 2 ")
                con.destroy();
                result(null, res);
            }

        });
    });
};

// Get the last and final chat for an order (Only return one message)
providerModel.getFinalChat = function (order_no, result) {
    var sql = "SELECT * FROM jlk_chat_history WHERE order_no=? ORDER BY message_id DESC LIMIT 1;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, order_no, function (err, res) {
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

// Insert Feedback
providerModel.insertFeedback = function (newData, tstamp, result) {

    var sql = "INSERT INTO jlk_feedback (txn_date, orders_no, feedback_by, feedback_to, tenant_type, rating, "
        + "comments, created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [tstamp, newData.orders_no, newData.feedback_by, newData.feedback_to, newData.tenant_type, newData.rating,
                newData.comments, newData.created_by, tstamp], function (err, res) {
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

// Get Feedback for a tenant
providerModel.getFeedback = function (feedback_to, result) {

    var sql = "SELECT * FROM jlk_feedback WHERE feedback_to=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, feedback_to, function (err, res) {
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

// Get Feedback for a tenant with customer name and picture
providerModel.getFeedbackWithProfile = function (feedback_to, result) {

    var sql = "SELECT fb.txn_date,fb.orders_no,fb.feedback_by,fb.feedback_to,fb.tenant_type,fb.rating,fb.comments,up.name,up.picture "
        + "FROM jlk_feedback fb JOIN jlk_user_profile up ON fb.feedback_by=up.user_id WHERE fb.feedback_to=? ORDER BY fb.txn_date DESC;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, feedback_to, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                res.forEach(element => {
                    // Convert the blob picture to based 64 string
                    var base64 = imageConverter.blobToBase64Img(element.picture)

                    // Set the base64 string as picture
                    element.picture = base64
                });
                con.destroy();
                result(null, res);
            }
        });
    });
};

// Insert A Clinic Schedule
providerModel.insertSchedule = function (newData, tstamp, result) {
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query('INSERT INTO pms_duty_roster (hfc_cd, user_id, start_date, start_time, end_time, status, quota, created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?)',
            [newData.hfc_cd, newData.user_id, newData.start_date, newData.start_time, newData.end_time, newData.status, newData.quota, newData.created_by, tstamp], function (err, res) {
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

// Check Duplicate Clinic Schedule
providerModel.checkDuplicateSchedule = function (newData, result) {
    var sql;
    sql = "SELECT user_id FROM pms_duty_roster WHERE user_id=? AND hfc_cd=? AND start_date=?"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.user_id, newData.hfc_cd, newData.start_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert Many Clinic Schedule
providerModel.insertScheduleMany = function (newData, tstamp, result) {

    // Create new array for nested array
    let nestedArray = []

    // Loop the data
    newData.forEach(element => {
        // Insert time stamp to all data
        element.created_date = tstamp

        // Extract the value of object and insert into the nestedArray
        nestedArray.push(Object.values(element))
    });

    var sql = 'INSERT INTO pms_duty_roster (hfc_cd, user_id, start_date, start_time, end_time, status, quota, created_by, created_date) VALUES ?'

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [nestedArray], function (err, res) {
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

// Get Clinic Schedule
providerModel.getSchedule = function (user_id, hfc_cd, start_date, end_date, result) {
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query('SELECT * FROM pms_duty_roster WHERE user_id=? AND hfc_cd=? AND start_date>=? AND start_date<=?', [user_id, hfc_cd, start_date, end_date], function (err, res) {
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

// Update Clinic Schedule Single
providerModel.updateSchedule = function (newData, result) {
    console.log(newData)

    var sql = "UPDATE pms_duty_roster SET start_time=?, end_time=?, status=?, quota=? WHERE user_id=? AND start_date=?";
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, [newData.start_time, newData.end_time, newData.status, newData.quota, newData.user_id, newData.start_date], function (err, res) {
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

// Update Many Clinic Schedule with Promises
providerModel.updateScheduleMany = function (newData, resolve, reject) {
    var sql = "UPDATE pms_duty_roster SET start_time=?, end_time=?, status=?, quota=? WHERE user_id=? AND start_date=?";
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, [newData.start_time, newData.end_time, newData.status, newData.quota, newData.user_id, newData.start_date], function (err, res) {
            if (err) {
                con.destroy();
                return reject(err);
            } else {
                con.destroy();
                return resolve(null);
            }
        });
    });
}

// Update Status to Full (Quota Full)
providerModel.updateScheduleStatusFull = function (newData, result) {
    var sql = "UPDATE pms_duty_roster SET status='full' WHERE user_id=? AND start_date=?";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.status, newData.user_id, newData.start_date], function (err, res) {
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

// Update Status to Unavailable (Quota Full)
providerModel.updateScheduleStatusUnavailable = function (newData, result) {
    var sql = "UPDATE pms_duty_roster SET status='unavailable' WHERE user_id=? AND start_date=?";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.status, newData.user_id, newData.start_date], function (err, res) {
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

// Update Status to Available
providerModel.updateScheduleStatusAvailable = function (newData, result) {
    var sql = "UPDATE pms_duty_roster SET status='available' WHERE user_id=? AND start_date=?";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.status, newData.user_id, newData.start_date], function (err, res) {
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

// Delete Clinic Schedule 
providerModel.deleteSchedule = function (user_id, start_date, result) {
    var sql = "DELETE FROM pms_duty_roster WHERE user_id=? AND start_date=?"
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [user_id, start_date], function (err, res) {
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

// Search complaints with description/name
providerModel.searchComplaint = function (keyword, result) {
    console.log("ok ok ok")
    var sql = "select RCC_DESC, RCC_CD from readcode_chief_complaint where CONCAT(UPPER(RCC_DESC),LOWER(RCC_DESC)) like '%" + keyword + "%' order by CHAR_LENGTH(rcc_desc), rcc_desc ASC;";

    pool.getConnection(function (errs, con) {
        console.log("-------------ok ok ok")
        if (errs) throw errs; // not connected!
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                console.log("ok ok ok----------")
                con.destroy();
                result(null, res);
            }

        });
    });
};

// Check for duplicate Complaint in lhs_sign
providerModel.checkDuplicateComplaint = function (newData, result) {
    var sql;
    sql = "SELECT symptom_cd FROM lhr_signs WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=? AND symptom_cd=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.symptom_cd], function (err, res) {
            if (err) {

                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                console.log(newData.encounter_date, "mcomsocm")
                console.log(res[0])
                if (res[0] || !res[0] == undefined) {

                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a complaint into database
providerModel.insertComplaint = function (newData, tstamp, result) {

    var sql = "INSERT INTO lhr_signs (pmi_no, hfc_cd, episode_date, encounter_date, txn_date, symptom_cd, symptom_name, term_type, " +
        "duration, unit, severity_desc, comment, status, created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {

        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, tstamp, newData.symptom_cd,
            newData.symptom_name, newData.term_type, newData.duration, newData.unit, newData.severity_desc, newData.comment,
            newData.status, newData.hfc_cd, tstamp],
            function (err, res) {
                console.log(res, "pdcnkv")
                if (err) {
                    console.log(err, "error----------------")
                    con.destroy();
                    result(err, null);
                } else {
                    console.log("good hefe----------")
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Update a complaint in database
providerModel.updateComplaint = function (newData, result) {
    var sql = "UPDATE lhr_signs SET symptom_name=?,term_type=?,severity_desc=?,comment=?,duration=?, unit=?, status=?" +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=? AND symptom_cd=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.symptom_name, newData.term_type, newData.severity_desc, newData.comment, newData.duration, newData.unit,
            newData.status, newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.symptom_cd],
            function (err, res) {
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

// Delete a complaint from database
providerModel.deleteComplaint = function (newData, result) {

    var sql = "DELETE FROM lhr_signs WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=? AND symptom_cd=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.symptom_cd],
            function (err, res) {
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

// Select complaints from database for a consultation session
providerModel.getComplaints = function (newData, result) {

    var sql = "SELECT * FROM lhr_signs WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Search diagnosis with description/name keyword
providerModel.searchDiagnosisName = function (keyword, result) {

    var sql = "select icd10_desc, icd10_code from icd10_codes where CONCAT(UPPER(icd10_desc),LOWER(icd10_desc)) like '%" + keyword + "%'  order by CHAR_LENGTH(icd10_desc), icd10_desc ASC;"
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
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
};

// Check for duplicate Complaint in lhs_sign
providerModel.checkDuplicateDiagnosis = function (newData, result) {
    var sql;
    sql = "SELECT diagnosis_cd FROM lhr_diagnosis WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=? AND diagnosis_cd=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.diagnosis_cd], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a diagnosis into database
providerModel.insertDiagnosis = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_diagnosis (pmi_no, hfc_cd, episode_date, encounter_date, diagnosis_cd, diagnosis_status, diagnosis_date, icd10_cd, icd10_description," +
        "term_cd, term_description, severity, comment, status, txnDate, created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.diagnosis_cd, newData.diagnosis_status,
            newData.diagnosis_date, newData.icd10_cd, newData.icd10_description, newData.term_cd, newData.term_description, newData.severity,
            newData.comment, newData.status, tstamp, newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a diagnosis in database
providerModel.updateDiagnosis = function (newData, result) {
    var sql = "UPDATE lhr_diagnosis SET diagnosis_status=?,severity=?,comment=?,status=?" +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=? AND diagnosis_cd=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.diagnosis_status, newData.severity, newData.comment, newData.status,
            newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.diagnosis_cd],
            function (err, res) {
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

// Delete a diagnosis from database
providerModel.deleteDiagnosis = function (newData, result) {

    var sql = "DELETE FROM lhr_diagnosis WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=? AND diagnosis_cd=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.diagnosis_cd],
            function (err, res) {
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

// Select diagnosises from database for a consultation session
providerModel.getDiagnosises = function (newData, result) {

    var sql = "SELECT * FROM lhr_diagnosis WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Body Temperature 
// Check for duplicate Body Temperature records in lhr_temperature
providerModel.checkDuplicateTemperature = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_temperature WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a body temperature record into database
providerModel.insertTemperature = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_temperature (pmi_no, hfc_cd, episode_date, encounter_date, temperature_reading, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date,
            newData.temperature_reading, newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a body temperature record in database
providerModel.updateTemperature = function (newData, result) {
    var sql = "UPDATE lhr_temperature SET temperature_reading=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.temperature_reading, newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a temperature record from database for a consultation session
providerModel.getTemperature = function (newData, result) {

    var sql = "SELECT * FROM lhr_temperature WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Blood Pressure
// Check for duplicate Blood Pressure records in lhr_bp
providerModel.checkDuplicateBP = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_bp WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a blood pressure record into database
providerModel.insertBP = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_bp (pmi_no, hfc_cd, episode_date, encounter_date, " +
        "systolic_sitting, diastolic_sitting, sitting_pulse, " +
        "systolic_standing, diastolic_standing, standing_pulse, " +
        "systolic_supine, diastolic_supine, supine_pulse, " +
        "discipline_cd, subdiscipline_cd, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date,
            newData.systolic_sitting, newData.diastolic_sitting, newData.sitting_pulse,
            newData.systolic_standing, newData.diastolic_standing, newData.standing_pulse,
            newData.systolic_supine, newData.diastolic_supine, newData.supine_pulse, "", "",
            newData.hfc_cd, tstamp],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Update a Blood Pressure records in database
providerModel.updateBP = function (newData, result) {
    var sql = "UPDATE lhr_bp SET " +
        "systolic_sitting=?, diastolic_sitting=?, sitting_pulse=?, " +
        "systolic_standing=?, diastolic_standing=?, standing_pulse=?, " +
        "systolic_supine=?, diastolic_supine=?, supine_pulse=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.systolic_sitting, newData.diastolic_sitting, newData.sitting_pulse,
            newData.systolic_standing, newData.diastolic_standing, newData.standing_pulse,
            newData.systolic_supine, newData.diastolic_supine, newData.supine_pulse,
            newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a blood pressure record from database for a consultation session
providerModel.getBP = function (newData, result) {
    var sql = "SELECT * FROM lhr_bp WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Remaining Vital Sign will do in PSM2
// Blood Glucose, Respiratory Rate, Cholesterol, Weight & Height & BMI

// Oxygen Saturation 
// Check for duplicate oxygen saturation records in lhr_spo2
providerModel.checkDuplicateOxygenSaturation = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_spo2 WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a oxygen saturation record into database
providerModel.insertOxygenSaturation = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_spo2 (pmi_no, hfc_cd, episode_date, encounter_date, spo2_reading, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date,
            newData.spo2_reading, newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a oxygen saturation record in database
providerModel.updateOxygenSaturation = function (newData, result) {
    var sql = "UPDATE lhr_spo2 SET spo2_reading=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.spo2_reading, newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a oxygen saturation record from database for a consultation session
providerModel.getOxygenSaturation = function (newData, result) {

    var sql = "SELECT * FROM lhr_spo2 WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Respiratory Rate
// Check for duplicate respiratory rate records in lhr_respiratory_rate
providerModel.checkDuplicateRespiratoryRate = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_respiratory_rate WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a respiratory rate record into database
providerModel.insertRespiratoryRate = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_respiratory_rate (pmi_no, hfc_cd, episode_date, encounter_date, rate, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date,
            newData.rate, newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a respiratory rate record in database
providerModel.updateRespiratoryRate = function (newData, result) {
    var sql = "UPDATE lhr_respiratory_rate SET rate=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.rate, newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a respiratory rate record from database for a consultation session
providerModel.getRespiratoryRate = function (newData, result) {

    var sql = "SELECT * FROM lhr_respiratory_rate WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Blood Glucose
// Check for duplicate blood glucose records in lhr_blood_glucose
providerModel.checkDuplicateBloodGlucose = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_blood_glucose WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a blood glucose record into database
providerModel.insertBloodGlucose = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_blood_glucose (pmi_no, hfc_cd, episode_date, encounter_date, blood_glucose_level, date_taken, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date,
            newData.blood_glucose_level, tstamp, newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a blood glucose record in database
providerModel.updateBloodGlucose = function (newData, tstamp, result) {
    var sql = "UPDATE lhr_blood_glucose SET blood_glucose_level=?, date_taken=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.blood_glucose_level, tstamp, newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a blood glucose record from database for a consultation session
providerModel.getBloodGlucose = function (newData, result) {

    var sql = "SELECT * FROM lhr_blood_glucose WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Cholesterol
// Check for duplicate Cholesterol records in lhr_cholesterol
providerModel.checkDuplicateCholesterol = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_cholesterol WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a Cholesterol record into database
providerModel.insertCholesterol = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_cholesterol (pmi_no, hfc_cd, episode_date, encounter_date, date_taken, " +
        "total_cholesterol, LDL_cholesterol, HDL_cholesterol, triglycerides, non_HDL_C, TG_to_HDL, " +
        "total_unit, LDL_unit, HDL_unit, Triglycerides_unit, non_HDL_C_unit, TG_to_HDL_ratio_unit, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, tstamp,
            newData.total_cholesterol, newData.LDL_cholesterol, newData.HDL_cholesterol, newData.triglycerides, newData.non_HDL_C, newData.TG_to_HDL,
            newData.total_unit, newData.LDL_unit, newData.HDL_unit, newData.Triglycerides_unit, newData.non_HDL_C_unit, newData.TG_to_HDL_ratio_unit,
            newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a Cholesterol record in database
providerModel.updateCholesterol = function (newData, tstamp, result) {
    var sql = "UPDATE lhr_cholesterol SET date_taken=?,total_cholesterol=?, LDL_cholesterol=?, HDL_cholesterol=?, triglycerides=?, non_HDL_C=?, TG_to_HDL=?, " +
        "total_unit=?, LDL_unit=?, HDL_unit=?, Triglycerides_unit=?, non_HDL_C_unit=?, TG_to_HDL_ratio_unit=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [tstamp, newData.total_cholesterol, newData.LDL_cholesterol, newData.HDL_cholesterol, newData.triglycerides, newData.non_HDL_C, newData.TG_to_HDL,
                newData.total_unit, newData.LDL_unit, newData.HDL_unit, newData.Triglycerides_unit, newData.non_HDL_C_unit, newData.TG_to_HDL_ratio_unit,
                newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a Cholesterol record from database for a consultation session
providerModel.getCholesterol = function (newData, result) {

    var sql = "SELECT * FROM lhr_cholesterol WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Weight, Height & BMI
// Check for duplicate Weight & Height records in lhr_weight_height
providerModel.checkDuplicateWeightHeight = function (newData, result) {
    var sql = "SELECT pmi_no FROM lhr_weight_height WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a Weight & Height record into database
providerModel.insertWeightHeight = function (newData, tstamp, result) {
    var sql = "INSERT INTO lhr_weight_height (pmi_no, hfc_cd, episode_date, encounter_date, weight_reading, height_reading, " +
        "created_by, created_date) VALUES (?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date, newData.weight_reading, newData.height_reading,
            newData.hfc_cd, tstamp],
            function (err, res) {
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

// Update a Weight & Height record in database
providerModel.updateWeightHeight = function (newData, result) {
    var sql = "UPDATE lhr_weight_height SET weight_reading=?, height_reading=? " +
        "WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.weight_reading, newData.height_reading, newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select a Weight & Height record from database for a consultation session
providerModel.getWeightHeight = function (newData, result) {

    var sql = "SELECT * FROM lhr_weight_height WHERE pmi_no=? AND hfc_cd=? AND episode_date=? AND encounter_date=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.pmi_no, newData.hfc_cd, newData.episode_date, newData.encounter_date],
            function (err, res) {
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

// Medication
// Search provider with name
providerModel.searchProvider = function (keyword, result) {
    console.log("99_iHIS_99")
    var sql = "SELECT hfc_name, hfc_cd from adm_health_facility where CONCAT(UPPER(hfc_name),LOWER(hfc_name)) like '%" + keyword + "%';";

    pool.getConnection(function (errs, con) {
        console.log("99_iHIS_99------")
        if (errs) throw errs; // not connected!
        con.query(sql, function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                console.log("99_iHIS_99------#############")
                con.destroy();
                result(null, res);
            }

        });
    });
};

// Search provider with code
providerModel.searchProviderName = function (hfc_cd, result) {
    var sql = "SELECT hfc_name, hfc_cd from adm_health_facility where hfc_cd=?;";

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, hfc_cd, function (err, res) {
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

// Search drugs with description/name
providerModel.searchDrugName = function (newData, result) {
    console.log(newData)
    var sql = "select DISTINCT CONCAT(d_trade_name, ' - ', d_gnr_name) AS d_name, ud_mdc_code, batch_no FROM pis_mdc2 " +
        "where (CONCAT(UPPER(d_trade_name),LOWER(d_trade_name)) LIKE '%" + newData.keyword + "%' " +
        "OR CONCAT(UPPER(d_gnr_name),LOWER(d_gnr_name)) LIKE '%" + newData.keyword + "%') " +
        "AND status = '1' AND " +
        "hfc_cd='" + newData.hfc_cd + "';"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
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
};

// Get Drug Data using Drug Code & Batch No
providerModel.getDrugData = function (newData, result) {
    console.log("getDrugData")
    var sql = "SELECT DISTINCT CONCAT(d_trade_name, ' - ', d_gnr_name) AS d_name, d_trade_name, d_gnr_name, d_qtyt, d_durationt, d_frequency, ud_mdc_code, " +
        "d_strength, d_route_code, d_form_code, batch_no " +
        "FROM pis_mdc2 WHERE ud_mdc_code=? AND status = '1' AND hfc_cd=? AND batch_no=?;";

    pool.getConnection(function (errs, con) {
        console.log("getDrugData")
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.ud_mdc_code, newData.hfc_cd, newData.batch_no], function (err, res) {
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

// Check for duplicate medication order master in pis_order_master
providerModel.checkDuplicateMedicationMaster = function (newData, result) {
    var sql;
    sql = "SELECT order_no FROM pis_order_master WHERE order_no=? AND pmi_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.order_no, newData.pmi_no], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a medication order master into pmi_order_master
providerModel.insertMedicationMaster = function (newData, tstamp, result) {

    var sql = "INSERT INTO pis_order_master (order_no, txn_date, pmi_no, health_facility_code, episode_date, " +
        "encounter_date, order_date, order_by, keyin_by, status, order_status) VALUES (?,?,?,?,?,?,?,?,?,?,?)";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.order_no, tstamp, newData.pmi_no, newData.health_facility_code, newData.episode_date,
            newData.encounter_date, tstamp, newData.tenant_id, newData.tenant_id, newData.status, newData.order_status],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Select medication order master data for a consultation session from pmi_order_master
providerModel.getMedicationMaster = function (newData, result) {

    var sql = "SELECT * FROM pis_order_master WHERE order_no=? AND pmi_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.order_no, newData.pmi_no, newData.health_facility_code],
            function (err, res) {
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

// Check for duplicate Medication in pis_order_detail
providerModel.checkDuplicateMedication = function (newData, result) {

    var sql = "SELECT drug_item_code FROM pis_order_detail WHERE order_no=? AND drug_item_code=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err;
        con.query(sql, [newData.order_no, newData.drug_item_code], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "duplicate");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "OK");
                }
            }
        });
    });
};

// Insert a medication into database
providerModel.insertMedication = function (newData, tstamp, result) {
    var sql = "INSERT INTO pis_order_detail (order_no, txn_date, drug_item_code, drug_item_desc, drug_frequency, " +
        "drug_route, drug_form, drug_strength, drug_dosage, duration, " +
        "order_status, qty_ordered, status, durationt, comment, batch_no) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);";

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.order_no, tstamp, newData.drug_item_code, newData.drug_item_desc, newData.drug_frequency,
            newData.drug_route, newData.drug_form, newData.drug_strength, newData.drug_dosage, newData.duration,
            newData.order_status, newData.qty_ordered, newData.status, newData.durationt, newData.comment, newData.batch_no],
            function (err, res) {
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

// Update a medication in database
providerModel.updateMedication = function (newData, result) {
    var sql = "UPDATE pis_order_detail SET drug_dosage=?,duration=?,qty_ordered=?,comment=?,status=?,order_status=?" +
        " WHERE order_no=? AND drug_item_code=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [newData.drug_dosage, newData.duration, newData.qty_ordered, newData.comment, newData.status, newData.order_status,
            newData.order_no, newData.drug_item_code],
            function (err, res) {
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

// Delete a medication from database
providerModel.deleteMedication = function (newData, result) {

    var sql = "DELETE FROM pis_order_detail WHERE order_no=? AND drug_item_code=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, [newData.order_no, newData.drug_item_code],
            function (err, res) {
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

// Select medications from database for a consultation session
providerModel.getMedications = function (newData, result) {

    var sql = "SELECT * FROM pis_order_detail WHERE order_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, newData.order_no,
            function (err, res) {
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

// Get Active Appointment for a tenant with specified date ranges, with some customer datas
providerModel.getAppointments = function (hfc_cd, start_date, end_date, result) {

    var sql = "SELECT pa.pmi_no, pa.hfc_cd, pa.appointment_date, pa.start_time, pa.txn_date, pa.userid, pa.order_no, " +
        "pa.status, up.name, up.id_number, up.mobile_no, up.email, up.picture, " +
        "up.home_address1, up.home_address2, up.home_address3 " +
        "FROM pms_appointment pa LEFT JOIN jlk_user_profile up ON pa.pmi_no=up.user_id " +
        "WHERE hfc_cd=? AND appointment_date>=? AND appointment_date<=? AND status='active' ORDER BY start_time ASC;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [hfc_cd, start_date, end_date], function (err, res) {
            if (err) {
                console.log(err)
                con.destroy();
                result(err, null);
            } else {

                res.forEach(element => {
                    // Convert the blob picture to based 64 string
                    var base64 = imageConverter.blobToBase64Img(element.picture)

                    // Set the base64 string as picture
                    element.picture = base64
                });

                con.destroy();
                result(null, res);
            }
        });
    });
};

// End an appointmnet with data
providerModel.endAppointment = function (newData, tstamp, result) {

    var sql = "UPDATE pms_appointment SET end_time=?, encounter_date=?, episode_date=?, status='end' WHERE order_no=?;";

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [tstamp, newData.encounter_date, newData.episode_date, newData.order_no],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Cancel an appointment
providerModel.cancelAppointment = function (newData, tstamp, result) {

    var sql = "UPDATE pms_appointment SET canceled_date=?, status='cancel' WHERE order_no=?;";

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [tstamp, newData.order_no],
            function (err, res) {
                if (err) {
                    console.log(err)
                    con.destroy();
                    result(err, null);
                } else {
                    con.destroy();
                    result(null, res);
                }
            });
    });
};

// Get User and User Profile Data with Id Number, for Pdf Generation
providerModel.getUserDataWithId = function (id_number, resolve, reject) {
    var sql = "SELECT * FROM jlk_user_profile WHERE id_number=?;"
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, id_number, function (err, res) {
            if (err) {
                con.destroy();
                return reject(err);
            } else {
                con.destroy();
                return resolve(res);
            }
        });
    });
}

// Get Tenant Data with Tenant Id, for Pdf purposes
providerModel.getTenantWithTenantId = function (tenant_id, resolve, reject) {
    var sql = "SELECT * FROM jlk_tenant WHERE tenant_id=?;";
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, tenant_id, function (err, res) {
            if (err) {
                con.destroy();
                return reject(err);
            } else {
                con.destroy();
                return resolve(res);
            }
        });
    });
}

// Select medication order master data for a consultation session from pmi_order_master, for Pdf Generation
providerModel.getMedicationMasterPromise = function (order_no, pmi_no, resolve, reject) {

    var sql = "SELECT * FROM pis_order_master WHERE order_no=? AND pmi_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql,
            [order_no, pmi_no],
            function (err, res) {
                if (err) {
                    con.destroy();
                    return reject(err);
                } else {
                    con.destroy();
                    return resolve(res);
                }
            });
    });
};

// Select medications from database for a consultation session, for Pdf generation
providerModel.getMedicationsPromise = function (order_no, resolve, reject) {

    var sql = "SELECT * FROM pis_order_detail WHERE order_no=?;"

    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, order_no,
            function (err, res) {
                if (err) {
                    con.destroy();
                    return reject(err);
                } else {
                    con.destroy();
                    return resolve(res);
                }
            });
    });
};

// Get health facility data with hfc code
providerModel.getHealthFacility = function (hfc_cd, resolve, reject) {
    var sql = "SELECT * from adm_health_facility where hfc_cd=?;";
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, hfc_cd, function (err, res) {
            if (err) {
                con.destroy();
                return reject(err);
            } else {
                con.destroy();
                return resolve(res);
            }
        });
    });
}

// Check EWallet Authtentication
providerModel.checkEWalletAuth = function (newData, result) {
    var sql = "SELECT * FROM ewl_account WHERE user_id=?;"
    pool.getConnection(function (err, con) {
        if (err) throw err; // not connected!
        con.query(sql, [newData.user_id], function (err, res) {
            if (err) {
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                if (res[0] || !res[0] == undefined) {
                    //convert buffer to string 
                    result(null, "OK");
                } else if (!res[0] || res[0] == undefined) {
                    result(null, "EMAILXDE");
                }
            }
        });
    });
};

// Update EWallet Amount
providerModel.updateEWalletAmount = function (newData, result) {

    var sql = "UPDATE ewl_account SET available_amt=available_amt+? WHERE user_id=?;"
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.payment, newData.user_id], function (err, res) {
            if (err) {
                console.log(err)
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                result(null, res);
            }
        });
    });
}

// Insert EWallet Account
providerModel.insertEWallet = function (newData, eWalletId, result) {
    var sql = "INSERT INTO ewl_account (user_id, ewallet_acc_no, available_amt, freeze_amt, float_amt, currency_cd, status) VALUES (?,?,?,?,?,?,?)";
    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.user_id, eWalletId, 0, 0, 0, '001', '001'], function (err, res) {
            if (err) {
                console.log(err)
                con.destroy();
                result(err, null);
            } else {
                con.destroy();
                result(null, res);
            }
        });
    });
}

// Get user and user profile data with image as blob
providerModel.getUserData2 = function (user_id, result) {

    var sql = "SELECT u.user_id, u.user_name, u.title, u.user_status, u.login_status, u.id_category_cd, u.start_date, u.end_date, u.remote_logout_date, u.remote_count, "
        + "u.user_type, u.user_category, u.user_classification_cd, u.status, u.room_no, up.name, up.id_type, up.id_number, up.gender_cd, up.nationality_cd, up.DOB, up.occupation_cd, up.home_address1, up.home_address2, "
        + "up.home_address3, up.district, up.state, up.country, up.postcode, up.mobile_no, up.email, up.picture, up.id_img FROM jlk_users u LEFT JOIN jlk_user_profile up ON u.user_id=up.user_id WHERE u.user_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, user_id, function (err, res) {
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

// Update user profile data with image as blob
providerModel.updateUserProfile2 = function (newData, picture, result) {
    var sql = "UPDATE jlk_user_profile SET title=?,name=?,id_type=?,id_number=?,gender_cd=?,nationality_cd=?,DOB=?,occupation_cd=?,home_address1=?,home_address2=?,home_address3=?,district=?,state=?,country=?,postcode=?,mobile_no=?,email=?,picture=?,id_img=? WHERE user_id=?;"

    pool.getConnection(function (errs, con) {
        if (errs) throw errs; // not connected!
        con.query(sql, [newData.title, newData.name, newData.id_type, newData.id_number, newData.gender, newData.nationality_cd,
        newData.DOB, newData.occupation_cd, newData.home_address1, newData.home_address2, newData.home_address3, newData.district,
        newData.state, newData.country, newData.postcode, newData.mobile_no, newData.email, picture, newData.id_img,
        newData.user_id],
            function (errss, resss) {
                if (errss) {
                    console.log(errss)
                    con.destroy();
                    result(errss, null);
                } else {
                    con.destroy();
                    result(null, resss);
                }
            });
    });
}

module.exports = providerModel;
