'use strict';

var Provid = require('../model/provider');
var MM = require('../model/Util/MessageManager');
var AUT = require('../model/Util/AuditTrail');
var md5 = require('md5');
var EmailHelper = require('../model/Util/EmailHelper');
var generator = require('generate-password');
require('dotenv').config();



var msg;
var newMM;
var auditData;
//date format must YYYY-MM-DD
//datetime format must YYYY-MM-DD HH:MM:SS

//process audit trail
function processAudit(datas){
    AUT.create(datas,function(err, data) {
        if (err){
          console.log("audit fail : "+ datas.id + " on "+ datas.tstamp);
          return err;
        }else{
          console.log("audit success : "+ datas.id + " on "+ datas.tstamp);
          return "1";
        }
        });
}

const providerCheckPost = function (req, res) {
    //this is compulsory item
    var txn_cd, datas, tstamp;
    txn_cd = req.body['txn_cd'];
    tstamp = req.body['tstamp'];
    datas = req.body['data'];

    //check if transaction code empty or not
    if (!txn_cd || txn_cd === "" || !tstamp || tstamp === "" || !datas) {
        msg = { "msj": "TXN" }
        MM.showMessage("TXN", function (dataMM) {
            res.status(400).send(dataMM);
            res.end();
        });
    } else {
        switch (txn_cd) {
            //check duplicate
            case 'MEDPRO01':
                if (!datas.userID || datas.userID == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    Provid.checkDuplicateID(datas.userID, function (error, returnData) {
                        if (error) {
                            res.send({ status: error.code });
                        } else {
                            //exist
                            if (returnData[0] || !returnData[0] == undefined) {
                                MM.showMessage("ER_DUP_ENTRY", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                                //not exist
                            } else if (!returnData[0] || returnData[0] == undefined) {
                                MM.showMessage("AVAIL", function (dataMM) {
                                    res.send(dataMM);
                                    res.end();
                                });
                            }
                        }
                    });
                }
                break;
            //add users
            case 'MEDPRO02':
                if (!datas.userID || datas.userID == "" || !datas.userName || datas.userName == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var users = [];
                    users.user_id = datas.userID;
                    users.user_name = datas.userName;
                    users.title = datas.title;
                    users.password = datas.password;
                    users.question = datas.question;
                    users.answer = datas.answer;
                    users.mother_name = datas.motherName;
                    users.user_status = datas.userStatus;
                    users.login_status = datas.loginStatus;
                    users.id_category = datas.idCategory;
                    users.remote_count = datas.remoteCount;
                    users.user_type = datas.userType;
                    users.user_category = datas.userCategory;
                    users.user_clasification_cd = datas.userClasificationCd;
                    users.status = datas.status;
                    users.room_no = datas.roomNo;
                    users.created_by = datas.userID;
                    users.created_date = tstamp;

                    if (datas.startDate == "" || !datas.startDate) {
                        users.start_date = "0000-00-00 00:00:00";
                    } else {
                        users.start_date = datas.startDate;
                    }

                    if (datas.endDate == "" || !datas.endDate) {
                        users.end_date = "0000-00-00 00:00:00";
                    } else {
                        users.end_date = datas.endDate;
                    }

                    if (datas.remoteLogoutDate == "" || !datas.remoteLogoutDate) {
                        users.remote_logout_date = "0000-00-00 00:00:00";
                    } else {
                        users.remote_logout_date = datas.remoteLogoutDate;
                    }


                    Provid.addUserID(users, function (error, returnData) {
                        if (error) {
                            //res.send({status:err.code});
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:users.user_id,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : users.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //add user profile 
            case 'MEDPRO03':
                if (!datas.userID || datas.userID == "" || !datas.userName || datas.userName == "" || datas.DOB == "" || !datas.DOB) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var users = [];
                    users.user_id = datas.userID;
                    users.name = datas.userName;
                    users.title = datas.title;
                    users.gender_cd = datas.gender;
                    users.nationality_cd = datas.nationality;
                    users.DOB = datas.DOB;
                    users.occupation_cd = datas.occupation;
                    users.home_address1 = datas.homeAddress1;
                    users.home_address2 = datas.homeAddress2;
                    users.home_address3 = datas.homeAddress3;
                    users.district = datas.district;
                    users.state = datas.state;
                    users.country = datas.country;
                    users.postcode = datas.postcode;
                    users.mobile_no = datas.mobileNo;
                    users.picture = datas.picture;
                    users.id_img = datas.idImg;
                    users.created_by = datas.userID;
                    users.created_date = tstamp;
                    users.email = datas.email;
                    users.id_type = datas.idType;
                    users.id_number = datas.idNumber;

                    Provid.addUserProfile(users, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:users.user_id,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : users.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO04':
                if (!datas.userID || datas.userID == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    Provid.getUsers(datas.userID, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(returnData, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //update users
            case 'MEDPRO05':
                if (!datas.userID || datas.userID == "" || !datas.userName || datas.userName == "") {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var users = [];
                    users.user_id = datas.userID;
                    users.user_name = datas.userName;
                    users.title = datas.title;
                    users.password = datas.password;
                    users.question = datas.question;
                    users.answer = datas.answer;
                    users.mother_name = datas.motherName;
                    users.user_status = datas.userStatus;
                    users.login_status = datas.loginStatus;
                    users.id_category = datas.idCategory;
                    users.remote_count = datas.remoteCount;
                    users.user_type = datas.userType;
                    users.user_category = datas.userCategory;
                    users.user_clasification_cd = datas.userClasificationCd;
                    users.status = datas.status;
                    users.room_no = datas.roomNo;
                    users.created_by = datas.userID;
                    users.created_date = tstamp;

                    if (datas.startDate == "" || !datas.startDate) {
                        users.start_date = "0000-00-00 00:00:00";
                    } else {
                        users.start_date = datas.startDate;
                    }

                    if (datas.endDate == "" || !datas.endDate) {
                        users.end_date = "0000-00-00 00:00:00";
                    } else {
                        users.end_date = datas.endDate;
                    }

                    if (datas.remoteLogoutDate == "" || !datas.remoteLogoutDate) {
                        users.remote_logout_date = "0000-00-00 00:00:00";
                    } else {
                        users.remote_logout_date = datas.remoteLogoutDate;
                    }


                    Provid.updateUser(users, function (error, returnData) {
                        if (error) {
                            //res.send({status:err.code});
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:users.user_id,txn_cd:txn_cd,tstamp:tstamp,activity:"UPDATE",created_by : users.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //update user profile
            case 'MEDPRO06':
                if (!datas.userID || datas.userID == "" || !datas.userName || datas.userName == "" || datas.DOB == "" || !datas.DOB) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var users = [];
                    users.user_id = datas.userID;
                    users.name = datas.userName;
                    users.title = datas.title;
                    users.gender_cd = datas.gender;
                    users.nationality_cd = datas.nationality;
                    users.DOB = datas.DOB;
                    users.occupation_cd = datas.occupation;
                    users.home_address1 = datas.homeAddress1;
                    users.home_address2 = datas.homeAddress2;
                    users.home_address3 = datas.homeAddress3;
                    users.district = datas.district;
                    users.state = datas.state;
                    users.country = datas.country;
                    users.postcode = datas.postcode;
                    users.mobile_no = datas.mobileNo;
                    users.picture = datas.picture;
                    users.id_img = datas.idImg;
                    users.created_by = datas.userID;
                    users.created_date = tstamp;
                    users.id_type = datas.idType;
                    users.id_number = datas.idNumber;

                    Provid.updateUserProfile(users, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:users.user_id,txn_cd:txn_cd,tstamp:tstamp,activity:"UPDATE",created_by : users.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //insert jlk_tenant
            case 'MEDPRO07':
                if (!datas.tenantId || datas.tenantId == "" || !datas.tenantName || datas.tenantName == "" || datas.tenantType == "" || !datas.tenantType) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.user_id = datas.userID;
                    tenant.tenant_type = datas.tenantType;
                    tenant.tenant_name = datas.tenantName;
                    tenant.director_name = datas.directorName;
                    tenant.tenant_address1 = datas.address1;
                    tenant.tenant_address2 = datas.address2;
                    tenant.tenant_address3 = datas.address3;
                    tenant.tenant_town_cd = datas.townCd;
                    tenant.tenant_district_cd = datas.districtCd;
                    tenant.tenant_state_cd = datas.stateCd;
                    tenant.tenant_country_cd = datas.countryCd;
                    tenant.tenant_postcode = datas.postcode;
                    tenant.tenant_phone_no = datas.phone;
                    tenant.tenant_email = datas.email;
                    tenant.package_type = datas.packageType;

                    if (datas.startDate == "" || !datas.startDate) {
                        tenant.start_date = "0000-00-00 00:00:00";
                    } else {
                        tenant.start_date = datas.startDate;
                    }

                    if (datas.endDate == "" || !datas.endDate) {
                        tenant.end_date = "0000-00-00 00:00:00";
                    } else {
                        tenant.end_date = datas.endDate;
                    }

                    tenant.status = datas.status;
                    tenant.organisation_name = datas.organisationName;
                    tenant.longitude = datas.longitude;
                    tenant.latitude = datas.latitude;
                    tenant.created_by = datas.userID;
                    tenant.created_date = tstamp;

                    Provid.insertTenant(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.userID,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : tenant.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            //update jlk_tenant
            case 'MEDPRO08':
                if (!datas.tenantId || datas.tenantId == "" || !datas.tenantName || datas.tenantName == "" || datas.tenantType == "" || !datas.tenantType) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.user_id = datas.userID;
                    tenant.tenant_type = datas.tenantType;
                    tenant.tenant_name = datas.tenantName;
                    tenant.director_name = datas.directorName;
                    tenant.tenant_address1 = datas.address1;
                    tenant.tenant_address2 = datas.address2;
                    tenant.tenant_address3 = datas.address3;
                    tenant.tenant_town_cd = datas.townCd;
                    tenant.tenant_district_cd = datas.districtCd;
                    tenant.tenant_state_cd = datas.stateCd;
                    tenant.tenant_country_cd = datas.countryCd;
                    tenant.tenant_postcode = datas.postcode;
                    tenant.tenant_phone_no = datas.phone;
                    tenant.tenant_email = datas.email;
                    tenant.package_type = datas.packageType;

                    if (datas.startDate == "" || !datas.startDate) {
                        tenant.start_date = "0000-00-00 00:00:00";
                    } else {
                        tenant.start_date = datas.startDate;
                    }

                    if (datas.endDate == "" || !datas.endDate) {
                        tenant.end_date = "0000-00-00 00:00:00";
                    } else {
                        tenant.end_date = datas.endDate;
                    }

                    tenant.status = datas.status;
                    tenant.organisation_name = datas.organisationName;
                    tenant.longitude = datas.longitude;
                    tenant.latitude = datas.latitude;
                    tenant.created_by = datas.userID;
                    tenant.created_date = tstamp;

                    Provid.updateTenant(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.userID,txn_cd:txn_cd,tstamp:tstamp,activity:"UPDATE",created_by : tenant.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO09':
                if (!datas.tenantId || datas.tenantId == "" || datas.tenantType == "" || !datas.tenantType) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.tenant_type = datas.tenantType;
                    tenant.hfc_type_cd = datas.hfc;
                    tenant.service_fee = datas.serviceFee;
                    tenant.deposit = datas.deposit;
                    tenant.discount = datas.discount;
                    tenant.tax = datas.tax;
                    tenant.BLC = datas.BLC;
                    tenant.APC = datas.APC;
                    tenant.created_by = datas.createdBy;
                    tenant.created_date = tstamp;

                    Provid.insertMaster(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.tenantId,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : tenant.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            case 'MEDPRO10':
                if (!datas.tenantId || datas.tenantId == "" || datas.tenantType == "" || !datas.tenantType) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.tenant_type = datas.tenantType;
                    tenant.hfc_type_cd = datas.hfc;
                    tenant.service_fee = datas.serviceFee;
                    tenant.deposit = datas.deposit;
                    tenant.discount = datas.discount;
                    tenant.tax = datas.tax;
                    tenant.BLC = datas.BLC;
                    tenant.APC = datas.APC;
                    tenant.created_by = datas.createdBy;
                    tenant.created_date = tstamp;

                    Provid.updateMaster(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.tenantId,txn_cd:txn_cd,tstamp:tstamp,activity:"UPDATE",created_by : tenant.created_by};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO11':
                if (!datas.customerId || datas.customerId == "" || datas.userId == "" || !datas.userId) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var customer = [];
                    customer.customer_id = datas.customerId;
                    customer.user_id = datas.userId;
                    customer.bank_acc_no = datas.bankAccNo;
                    customer.bank_name = datas.bankName;
                    customer.bank_address1 = datas.address1;
                    customer.bank_address2 = datas.address2;
                    customer.bank_address3 = datas.address3;
                    customer.district_cd = datas.district;
                    customer.state_cd = datas.state;
                    customer.gl_acc_cd = datas.glAccCd;
                    customer.acc_type = datas.accType;
                    customer.status = datas.status;
                    customer.created_by = datas.createdBy;
                    customer.created_date = tstamp;

                    Provid.insertCustAcc(customer, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.customerId,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : datas.createdBy};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO12':
                if (!datas.customerId || datas.customerId == "" || datas.userId == "" || !datas.userId) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var customer = [];
                    customer.customer_id = datas.customerId;
                    customer.user_id = datas.userId;
                    customer.bank_acc_no = datas.bankAccNo;
                    customer.bank_name = datas.bankName;
                    customer.bank_address1 = datas.address1;
                    customer.bank_address2 = datas.address2;
                    customer.bank_address3 = datas.address3;
                    customer.district_cd = datas.district;
                    customer.state_cd = datas.state;
                    customer.gl_acc_cd = datas.glAccCd;
                    customer.acc_type = datas.accType;
                    customer.status = datas.status;
                    customer.created_by = datas.createdBy;
                    customer.created_date = tstamp;

                    Provid.updateCustAcc(customer, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.customerId,txn_cd:txn_cd,tstamp:tstamp,activity:"UPDATE",created_by : datas.createdBy};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO13':
                if (!datas.tenantId || datas.tenantId == "" || datas.qualificationCd == "" || !datas.qualificationCd || datas.fieldStudy == "" || !datas.fieldStudy) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var qualification = [];
                    qualification.tenant_id = datas.tenantId;
                    qualification.qualification_cd = datas.qualificationCd;
                    qualification.field_study = datas.fieldStudy;
                    qualification.university_name = datas.universityName;
                    qualification.graduation_year = datas.graduationYear;
                    qualification.created_by = datas.createdBy;
                    qualification.created_date = tstamp;

                    Provid.insertQualification(qualification, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.tenantId,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : datas.createdBy};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO14':
                if (!datas.tenantId || datas.tenantId == "" || datas.qualificationCd == "" || !datas.qualificationCd || datas.fieldStudy == "" || !datas.fieldStudy) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var qualification = [];
                    qualification.tenant_id = datas.tenantId;
                    qualification.qualification_cd = datas.qualificationCd;
                    qualification.field_study = datas.fieldStudy;
                    qualification.university_name = datas.universityName;
                    qualification.graduation_year = datas.graduationYear;
                    qualification.created_by = datas.createdBy;
                    qualification.created_date = tstamp;

                    Provid.updateQualification(qualification, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.tenantId,txn_cd:txn_cd,tstamp:tstamp,activity:"UPDATE",created_by : datas.createdBy};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO15':
                if (!datas.tenantId || datas.tenantId == "" || datas.languageCd == "" || !datas.languageCd) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var language = [];
                    language.tenant_id = datas.tenantId;
                    language.language_cd = datas.languageCd;
                    language.created_by = datas.createdBy;
                    language.created_date = tstamp;

                    Provid.insertLanguage(language, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            auditData = {id:datas.tenantId,txn_cd:txn_cd,tstamp:tstamp,activity:"INSERT",created_by : datas.createdBy};
                            processAudit(auditData);
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO16':
                if (!datas.tenantId || datas.tenantId == "" || datas.languageCd == "" || !datas.languageCd) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var language = [];
                    language.tenant_id = datas.tenantId;
                    language.language_cd = datas.languageCd;
                    language.created_by = datas.createdBy;
                    language.created_date = tstamp;

                    Provid.deleteLanguage(language, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;


            case 'MEDPRO17':
                if (!datas.tenantId || datas.tenantId == "" || datas.specialtyCd == "" || !datas.specialtyCd) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var specialty = [];
                    specialty.tenant_id = datas.tenantId;
                    specialty.specialty_cd = datas.specialtyCd;
                    specialty.status = datas.status;
                    specialty.created_by = datas.createdBy;
                    specialty.created_date = tstamp;

                    Provid.insertSpecialty(specialty, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO18':
                if (!datas.tenantId || datas.tenantId == "" || datas.specialtyCd == "" || !datas.specialtyCd) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var specialty = [];
                    specialty.tenant_id = datas.tenantId;
                    specialty.specialty_cd = datas.specialtyCd;
                    specialty.status = datas.status;
                    specialty.created_by = datas.createdBy;
                    specialty.created_date = tstamp;

                    Provid.updateSpecialty(specialty, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO19':
                if (!datas.tenantId || datas.tenantId == "" || datas.workingDay == "" || !datas.workingDay || datas.startTime == "" || !datas.startTime || datas.endTime == "" || !datas.endTime) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var workingDay = [];
                    workingDay.tenant_id = datas.tenantId;
                    workingDay.working_day = datas.workingDay;
                    workingDay.start_time = datas.startTime;
                    workingDay.end_time = datas.endTime;
                    workingDay.created_by = datas.createdBy;
                    workingDay.created_date = tstamp;

                    Provid.insertWorkingDay(workingDay, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

            case 'MEDPRO20':
                if (!datas.tenantId || datas.tenantId == "" || datas.workingDay == "" || !datas.workingDay || datas.startTime == "" || !datas.startTime || datas.endTime == "" || !datas.endTime) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var workingDay = [];
                    workingDay.tenant_id = datas.tenantId;
                    workingDay.working_day = datas.workingDay;
                    workingDay.start_time = datas.startTime;
                    workingDay.end_time = datas.endTime;
                    workingDay.created_by = datas.createdBy;
                    workingDay.created_date = tstamp;

                    Provid.updateWorkingDay(workingDay, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;
                
                case 'MEDPRO21':
                if (!datas.workingDays || datas.workingDays === "" ) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var arrayWorkingDay = [];
                    for(var i = 0; i < datas.workingDays.length; i ++){
                        var workingDay = [];
                        workingDay.push(datas.workingDays[i].tenantId);
                        workingDay.push(datas.workingDays[i].workingDay);
                            workingDay.push(datas.workingDays[i].startTime);
                                workingDay.push(datas.workingDays[i].endTime);
                                    workingDay.push(datas.workingDays[i].createdBy);
                                        workingDay.push(tstamp);
                        arrayWorkingDay.push(workingDay);
                    }
                    Provid.insertWorkingDayBulk(arrayWorkingDay, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage("1", function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

                case 'MEDPRO22':
                if (!datas.tenantId || datas.tenantId == "" || datas.tenantType == "" || !datas.tenantType) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.tenant_type = datas.tenantType;
                    tenant.created_date = tstamp;
                    

                    Provid.getTenant(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(returnData, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

                case 'MEDPRO23':
                if (!datas.tenantId || datas.tenantId == "" || datas.specialtyCd == "" || !datas.specialtyCd) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.specialty_cd = datas.specialtyCd;
                    

                    Provid.getSpecialty(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(returnData, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

                case 'MEDPRO24':
                if (!datas.tenantId || datas.tenantId == "" || datas.qualificationCd == "" || !datas.qualificationCd || datas.fieldStudy == "" || !datas.fieldStudy) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.qualification_cd = datas.qualificationCd;
                    tenant.field_study = datas.fieldStudy;
                    

                    Provid.getQualification(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(returnData, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

                case 'MEDPRO25':
                if (!datas.tenantId || datas.tenantId == "" || datas.workingDay == "" || !datas.workingDay || datas.startTime == "" || !datas.startTime) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.working_day = datas.workingDay;
                    tenant.start_time = datas.startTime;
                    

                    Provid.getWorkingDay(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(returnData, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;

                case 'MEDPRO26':
                if (!datas.tenantId || datas.tenantId == "" || datas.tenantType == "" || !datas.tenantType ) {
                    MM.showMessage("B", function (dataMM) {
                        res.status(400).send(dataMM);
                        res.end();
                    });
                } else {
                    var tenant = [];
                    tenant.tenant_id = datas.tenantId;
                    tenant.tenant_type = datas.tenantType;
                    

                    Provid.getMaster(tenant, function (error, returnData) {
                        if (error) {
                            MM.showMessage(error.code, function (dataMM) {
                                res.status(400).send(dataMM);
                                res.end();
                            });
                        } else {
                            MM.showMessage(returnData, function (dataMM) {
                                res.send(dataMM);
                                res.end();
                            });
                        }
                    });
                }
                break;
        }


    }
}

const auditTrailCtrl = function(req,res){

    var txn_cd, datas, tstamp;
    txn_cd = req.body['txn_cd'];
    tstamp = req.body['tstamp'];
    datas = req.body['data'];

    AUT.create(datas,function(err, data) {
        if (err){
            res.send({ status: error.code });
        }else{
            MM.showMessage("1", function (dataMM) {
                res.send(dataMM);
                res.end();
            });
        }
        });
}

module.exports = {
    providerCheckPost: providerCheckPost,
    auditTrailCtrl : auditTrailCtrl
};