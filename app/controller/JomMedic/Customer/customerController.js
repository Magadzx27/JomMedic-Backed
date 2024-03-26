'use strict';

var customerModel = require('../../../model/customerModel');
var MM = require('../../../model/Util/MessageManager');
var EmailHelper = require('../../../model/Util/EmailHelper');
var md5 = require('md5');
var format = require('date-fns/format');
var set = require('date-fns/set');
const fetch = require('node-fetch');
var nodemailer = require('nodemailer');
require('dotenv').config();
var msg;
var newMM;

const custfunction = function (req, res) {
    // console.log(req);
    var transactionCode, data, timestamp;
    transactionCode = req.body['transactionCode'];

    data = req.body['data'];
    timestamp = req.body['timestamp'];

    function generateId(UNQ) {
        let bodyData = {
            txn_cd: 'UNQGEN',
            tstamp: format(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            data: {
                UNQ: UNQ,
            }
        };

        return fetch('http://localhost:3001/UNQ', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
        }).then((response) => response.text())
            .catch((error) => {
                let responseData = {
                    result: false,
                    value: "Fail to generate id",
                }
                res.send(responseData);
                res.end();
            });

    }

    if (!transactionCode || transactionCode === "" || !timestamp || timestamp === "" || !data) {

        let responseData = {
            result: false,
            value: "Fail to Make Request",
        }
        res.send(responseData);
        res.end();
    }
    else {

        switch (transactionCode) {

            case 'SIGNUP':
                console.log("vdvsvds");
                // data = JSON.parse(data);
                if (!data.Name || !data.Email || !data.Password || !data.ConfirmPassword || !data.IcPassportNo || !data.PhoneNo || !data.Question || !data.Answer) {

                    let responseData = {
                        result: false,
                        value: "Please fill in all the field",
                    }
                    res.send(responseData);
                    res.end();
                }
                else if (data.Password !== data.ConfirmPassword) {
                    let responseData = {
                        result: false,
                        value: "Password is not matched",
                    }
                    res.send(responseData);
                    res.end();
                }
                else if (data.IcPassportNo.length != 12) {
                    let responseData = {
                        result: false,
                        value: "Invalid IC",
                    }
                    res.send(responseData);
                    res.end();
                }
                else if (data.PhoneNo.length != 10) {
                    let responseData = {
                        result: false,
                        value: "Invalid Phone No",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {

                    let dob = new Date(data.DateOfBirth);
                    data.DateOfBirth = dob.getFullYear().toString() + "-" + (dob.getMonth() + 1).toString()
                        + "-" + dob.getDate().toString();

                    Promise.all([generateId('EWL'), generateId('CUS')])
                        .then(([ewalletId, customerId]) => {
                            customerModel.signUp(ewalletId, data.Name, data.Email, data.Password, customerId, data.IcPassportNo,
                                data.PhoneNo, data.Question, data.Answer, req.file.buffer, function (err, modelRes) {
                                    if (err) {
                                        console.log(err);

                                        let responseData = {
                                            result: false,
                                            value: "Error: " + err.errno + " " + err.code,
                                        }

                                        res.send(responseData);
                                        res.end();
                                    }
                                    else {
                                        res.send(modelRes);
                                        res.end();
                                    }
                                });
                        })
                        .catch((error) => {
                            let responseData = {
                                result: false,
                                value: "Fail to generate id",
                            }
                            res.send(responseData);
                            res.end();
                        });

                }
                break;

            case 'USERTYPE':
                if (!data.Email) {
                    let responseData = {
                        result: false,
                        value: "Please fill in all the field",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.userType(data.Email, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'LOGIN':
                console.log("dvdvd")
                if (!data.Email || !data.Password) {
                    let responseData = {
                        result: false,
                        value: "Please fill in all the field",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.login(data.Email, data.Password, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'FORGETPASS':
                if (!data.Email) {
                    let responseData = {
                        result: false,
                        value: "Please fill in all the field",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.forgetPassword(data.Email, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'RESETPASS':
                if (!data.Email || !data.Answer) {
                    let responseData = {
                        result: false,
                        value: "Please fill in all the field",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    let randomPass = ("" + Math.random()).substring(2, 8);
                    // let randomPass = '123';
                    customerModel.resetPassword(data.Email, data.Answer, randomPass, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            if (modelRes.result === true) {
                                var email = {
                                    receiver: data.Email,
                                    // receiver: 'chern-97@hotmail.com',
                                    subject: 'JomMedic - Reset Account Password',
                                    text: 'Your account password has been reset to ' + randomPass,
                                    sender: process.env.EMAIL_USER,
                                    user: process.env.EMAIL_USER,
                                    pass: process.env.EMAIL_PASS
                                };


                                EmailHelper.sendGG(email, function (err, result) {
                                    if (err) {
                                        console.log(err);
                                        let responseData = {
                                            result: false,
                                            value: "Fail to send email",
                                        }

                                        res.send(responseData);
                                        res.end();
                                    }
                                    else {
                                        let responseData = {
                                            result: true,
                                            value: 'Reset Password Successful. Please check your email'
                                        }
                                        res.send(responseData);
                                        res.end();
                                    }
                                });

                                // var transporter = nodemailer.createTransport({
                                //     service: 'gmail',
                                //     auth: {
                                //         user: 'fashiononfire123@gmail.com',
                                //         pass: 'fashion123!'
                                //     }
                                // });

                                // var mailOptions = {
                                //     // user email
                                //     from: 'fashiononfire123@gmail.com',
                                //     // to: data.Email,
                                //     to: 'chern-97@hotmail.com',
                                //     subject: 'Jomedic Reset Account Password',
                                //     text: 'Your account password has been reset to ' + randomPass
                                // };

                                // transporter.sendMail(mailOptions, function (err, info) {
                                //     if (err) {
                                //         console.log(err);
                                //         let responseData = {
                                //             result: false,
                                //             value: "Fail to send email",
                                //         }

                                //         res.send(responseData);
                                //         res.end();
                                //     }
                                //     else {
                                //         let responseData = {
                                //             result: true,
                                //             value: 'Reset Password Successful. Please check your email'
                                //         }
                                //         res.send(responseData);
                                //         res.end();
                                //     }
                                // });
                            }
                            else {
                                res.send(modelRes);
                                res.end();
                            }
                        }
                    });
                }
                break;

            case 'GETSTATE':

                customerModel.getState(function (err, modelRes) {
                    if (err) {
                        console.log(err);

                        let responseData = {
                            result: false,
                            value: "Error: " + err.errno + " " + err.code,
                        }

                        res.send(responseData);
                        res.end();
                    }
                    else {
                        res.send(modelRes);
                        res.end();
                    }
                });

                break;

            case 'MAP':

                customerModel.map(function (err, modelRes) {
                    if (err) {
                        console.log(err);

                        let responseData = {
                            result: false,
                            value: "Error: " + err.errno + " " + err.code,
                        }

                        res.send(responseData);
                        res.end();
                    }
                    else {
                        res.send(modelRes);
                        res.end();
                    }
                });

                break;

            case 'DOCTOR':

                customerModel.doctor(function (err, modelRes) {
                    if (err) {
                        console.log(err);

                        let responseData = {
                            result: false,
                            value: "Error: " + err.errno + " " + err.code,
                        }

                        res.send(responseData);
                        res.end();
                    }
                    else {
                        res.send(modelRes);
                        res.end();
                    }
                });

                break;

            case 'HEALTHCARE':

                customerModel.healthcare(function (err, modelRes) {
                    if (err) {
                        console.log(err);

                        let responseData = {
                            result: false,
                            value: "Error: " + err.errno + " " + err.code,
                        }

                        res.send(responseData);
                        res.end();
                    }
                    else {
                        res.send(modelRes);
                        res.end();
                    }
                });

                break;

            case 'HEALTHCAREDETAIL':
                if (!data.HealthcareId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.healthcareDetail(data.HealthcareId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            modelRes.data[1][0].rating = modelRes.data[2][0].rating;
                            modelRes.data[1][0].review_count = modelRes.data[2][0].review_count;
                            modelRes.data = modelRes.data[1];

                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'HEALTHCAREDOCTOR':
                if (!data.HealthcareId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.healthcareDoctor(data.HealthcareId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'DOCTORDETAIL':
                if (!data.DoctorId || !data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.doctorDetail(data.DoctorId, data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            let date = new Date();
                            modelRes.data[1][0].graduation_year = date.getFullYear() - modelRes.data[1][0].graduation_year;

                            let Time = [];

                            modelRes.data[2].forEach(function (value, index) {
                                Time.push({
                                    id: index,
                                    week: value.week,
                                    startDate: value.start_date,
                                    startTime: value.start_time,
                                    endTime: value.end_time,
                                    status: value.status,
                                    quota: value.quota
                                })
                            });
                            modelRes.data = modelRes.data[1];
                            modelRes.data[0].appointmentTimeList = Time;

                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'GETWALLET':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.getWallet(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;


            case 'CREATECHAT':
                if (!data.CustomerId || !data.DoctorId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    console.log("-------------------------case1")
                    res.send(responseData);
                    res.end();
                }
                else {
                    generateId('ORD').then(orderNo => {
                        console.log({ orderNo })
                        customerModel.createChat(data.CustomerId, data.DoctorId, orderNo, function (err, modelRes) {
                            if (err) {
                                console.log(err);

                                let responseData = {
                                    result: false,
                                    value: "Error: " + err.errno + " " + err.code,
                                }
                                console.log("-------------------------case2")
                                res.send(responseData);
                                res.end();
                            }
                            else {
                                console.log("-------------------------case3")
                                res.send(modelRes);
                                res.end();
                            }
                        });
                    }).catch((error) => {
                        let responseData = {
                            result: false,
                            value: "Fail to generate id",
                        }
                        res.send(responseData);
                        res.end();
                    });

                }
                break;

            case 'CHECKCHAT':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.checkChat(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {

                            res.send(modelRes);
                            res.end();
                        }
                    });

                }
                break;

            case 'GETCHAT':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.getChatMessage(data.OrderNo, function (err, modelRes) {

                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            modelRes.order_status = modelRes.data[2][0].order_status;
                            modelRes.data = modelRes.data[1];
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;


            case 'SENDCHAT':
                console.log("-------------------------SENDCHAT")

                if (!data.CustomerId || !data.DoctorId || !data.Message || !data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.sendChatMessage(data.CustomerId, data.DoctorId, data.Message, data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'ENDLIVECHAT':
                if (!data.OrderNo || !data.DoctorId || !data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.endLiveChat(data.OrderNo, data.CustomerId, data.DoctorId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'CHATENDED':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.chatEnded(data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'CREATEVIDEO':
                if (!data.CustomerId || !data.DoctorId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    generateId('ORD').then(orderNo => {
                        customerModel.createVideoCall(data.CustomerId, data.DoctorId, orderNo, function (err, modelRes) {
                            if (err) {
                                console.log(err);

                                let responseData = {
                                    result: false,
                                    value: "Error: " + err.errno + " " + err.code,
                                }

                                res.send(responseData);
                                res.end();
                            }
                            else {

                                modelRes.data = { orderNo: orderNo }
                                res.send(modelRes);
                                res.end();
                            }
                        });
                    })
                        .catch((error) => {
                            let responseData = {
                                result: false,
                                value: "Fail to generate id",
                            }
                            res.send(responseData);
                            res.end();
                        });

                }
                break;

            case 'CHECKREJECT':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.checkReject(data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });

                }
                break;

            case 'CANCELVIDEO':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.cancelVideoCall(data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {

                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;


            case 'VIDEOEND':
                if (!data.CustomerId || !data.ChatDuration || !data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.videoCallEnd(data.CustomerId, data.ChatDuration, data.OrderNo, function (err, modelRes) {

                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {

                            res.send(modelRes);
                            res.end();
                        }
                    });

                }
                break;

            case 'MAKEAPPOINTMENT':

                if (!data.CustomerId || !data.DoctorId || !data.Date || !data.Time) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    //sub to match pms_duty_roster timezone

                    data.Date = format(new Date(data.Date), 'yyyy-MM-dd HH:mm:ss');
                    data.Time = format(set(new Date(data.Time), {
                        year: new Date(data.Date).getFullYear(), month: new Date(data.Date).getMonth(), date: new Date(data.Date).getDate()
                    }), 'yyyy-MM-dd HH:mm:ss');


                    generateId('ORD').then(orderNo => {
                        customerModel.makeAppointment(data.CustomerId, data.DoctorId, data.Date, data.Time, orderNo, function (err, modelRes) {
                            if (err) {
                                console.log(err);

                                let responseData = {
                                    result: false,
                                    value: "Error: " + err.errno + " " + err.code,
                                }

                                res.send(responseData);
                                res.end();
                            }
                            else {
                                modelRes.orderNo = orderNo;
                                res.send(modelRes);
                                res.end();
                            }
                        });
                    })
                        .catch((error) => {
                            let responseData = {
                                result: false,
                                value: "Fail to generate id",
                            }
                            res.send(responseData);
                            res.end();
                        });

                }
                break;

            case 'APPOINTMENT':

                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {

                    customerModel.appointment(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            let appointmentList = [];
                            let appointmentDate = '';
                            let appointmentItem = [];
                            let dataMaxIndex = modelRes.data.length - 1;

                            modelRes.data.forEach((element, index) => {

                                let appointmentItemObject = {
                                    doctorId: element.tenant_id,
                                    date: element.appointment_date,
                                    orderNo: element.order_no,
                                    doctorName: element.tenant_name,
                                    startTime: element.start_time,
                                    address: element.address,
                                    latitude: element.latitude,
                                    longtitude: element.longtitude
                                }

                                if (appointmentDate === '') {
                                    appointmentDate = element.appointment_date;
                                }
                                else if (appointmentDate !== element.appointment_date) {
                                    appointmentList.push({ date: appointmentDate, appointment: appointmentItem });
                                    appointmentItem = [];
                                    appointmentDate = element.appointment_date;
                                }

                                appointmentItem.push(appointmentItemObject);

                                if (index === dataMaxIndex) {
                                    appointmentList.push({ date: appointmentDate, appointment: appointmentItem });
                                }

                            });
                            modelRes.data = appointmentList;
                            res.send(modelRes);
                            res.end();
                        }
                    });

                }
                break;

            case 'CANCELAPPOINTMENT':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {

                    customerModel.cancelAppointment(data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'APPOINTMENTSTART':
                if (!data.CustomerId || !data.DoctorId || !data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.createVideoCall(data.CustomerId, data.DoctorId, data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });


                }
                break;

            case 'RATE':
                // rating comment and feedback may empty
                if (!data.CustomerId || !data.DoctorId || !data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    let feedback = "";

                    for (let property in data.Feedback) {
                        if (data.Feedback[property] === true) {
                            feedback += property + ",";
                        }
                    }

                    feedback = feedback.substring(0, feedback.length - 1);

                    data.Comment = feedback + ";/*" + data.Comment;
                    customerModel.giveRating(data.CustomerId, data.DoctorId, data.OrderNo, data.Rating, data.Comment, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;

            case 'GETGENDER':

                customerModel.getGender(function (err, modelRes) {
                    if (err) {
                        console.log(err);

                        let responseData = {
                            result: false,
                            value: "Error: " + err.errno + " " + err.code,
                        }

                        res.send(responseData);
                        res.end();
                    }
                    else {
                        res.send(modelRes);
                        res.end();
                    }
                });

                break;

            case 'UPDATEPROFILE':
                data = JSON.parse(data);
                if (!data.CustomerId || !data.Name || !data.IcPassportNo || !data.PhoneNo || !data.Gender || !data.DateOfBirth
                    || !data.AddressLine1 || !data.AddressLine2 || !data.AddressLine3 || !data.City || !data.State || !req.file) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    let dob = new Date(data.DateOfBirth);
                    data.DateOfBirth = dob.getFullYear().toString() + "-" + (dob.getMonth() + 1).toString()
                        + "-" + dob.getDate().toString();

                    customerModel.updateProfile(data.CustomerId, data.Name, data.IcPassportNo, data.PhoneNo, data.Gender, data.DateOfBirth,
                        data.AddressLine1, data.AddressLine2, data.AddressLine3, data.City, data.State, req.file.buffer,
                        function (err, modelRes) {
                            if (err) {
                                console.log(err);

                                let responseData = {
                                    result: false,
                                    value: "Error: " + err.errno + " " + err.code,
                                }

                                res.send(responseData);
                                res.end();
                            }
                            else {
                                res.send(modelRes);
                                res.end();
                            }
                        });
                }
                break;

            case 'PROFILE':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.profile(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'SELFINFO':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.selfInfo(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'CONTACT':
                if (!data.CustomerId || !data.Subject || !data.Content) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.getEmail(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            var email = {
                                receiver: modelRes.data[0].email,
                                // receiver: 'chern-97@hotmail.com',
                                subject: 'JomMedic - Contact Us',
                                text: 'We have received your email. Our staff will contact you soon.',
                                sender: process.env.EMAIL_USER,
                                user: process.env.EMAIL_USER,
                                pass: process.env.EMAIL_PASS
                            };

                            // var transporter = nodemailer.createTransport({
                            //     service: 'gmail',
                            //     auth: {
                            //         user: 'fashiononfire123@gmail.com',
                            //         pass: 'fashion123!'
                            //     }
                            // });

                            // var mailOptions = {
                            //     // user email
                            //     // modelRes.data[0].email
                            //     from: modelRes.data[0].email,
                            //     // to: modelRes.data[0].email,
                            //     to: 'chern-97@hotmail.com',
                            //     subject: data.Subject,
                            //     text: data.Content
                            // };

                            // transporter.sendMail(mailOptions, function (err, info) {
                            //     if (err) {
                            //         console.log(err);
                            //         let responseData = {
                            //             result: false,
                            //             value: "Fail to send email",
                            //         }

                            //         res.send(responseData);
                            //         res.end();
                            //     }
                            //     else {
                            //         let responseData = {
                            //             result: true,
                            //         }
                            //         res.send(responseData);
                            //         res.end();
                            //     }
                            // });

                            EmailHelper.sendGG(email, function (err, result) {
                                if (err) {
                                    console.log(err);
                                    let responseData = {
                                        result: false,
                                        value: "Fail to send email",
                                    }

                                    res.send(responseData);
                                    res.end();
                                }
                                else {
                                    let responseData = {
                                        result: true,
                                    }
                                    res.send(responseData);
                                    res.end();
                                }
                            });
                        }
                    });
                }

                break;

            case 'CURRENTCHAT':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.currentChat(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'HISTORY':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.history(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {

                            res.send(modelRes);
                            res.end();

                        }
                    });
                }

                break;

            case 'HISTORYDETAIL':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.historyDetail(data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {

                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'CHGPASS':
                if (!data.CustomerId || !data.OldPassword || !data.NewPassword || !data.ConfirmPassword) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else if (data.NewPassword !== data.ConfirmPassword) {
                    let responseData = {
                        result: false,
                        value: "Password is not matched",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.changePassword(data.CustomerId, data.OldPassword, data.NewPassword, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'VIEWRATING':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.viewRating(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'PREVIOUSCHAT':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.previousChat(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'CHATHISTORY':
                if (!data.OrderNo) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.chatHistory(data.OrderNo, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }

                break;

            case 'LOGOUT':
                if (!data.CustomerId) {
                    let responseData = {
                        result: false,
                        value: "Empty Data Detected",
                    }
                    res.send(responseData);
                    res.end();
                }
                else {
                    customerModel.logout(data.CustomerId, function (err, modelRes) {
                        if (err) {
                            console.log(err);

                            let responseData = {
                                result: false,
                                value: "Error: " + err.errno + " " + err.code,
                            }

                            res.send(responseData);
                            res.end();
                        }
                        else {
                            res.send(modelRes);
                            res.end();
                        }
                    });
                }
                break;


            case 'AUTH01':
                if (!data.email || !data.password || data.email == "" || data.password == "") {
                    res.send('empty');
                    res.end();

                }
                else {
                    customerModel.login(data.email, data.password, function (err, modelRes) {
                        if (err) {
                            res.send({ status: err.code });
                        }
                        else {
                            if (modelRes == 'good') {
                                res.send({ status: 'good' });
                                res.end();
                            }
                            else {
                                res.send({ status: 'fail' });
                                res.end();
                            }
                        }
                    });

                }

                break;

            case 'READ01':
                customerModel.view(function (err, modelRes) {
                    if (err) {
                        res.send({ status: err.code });
                    }
                    else {
                        res.send(modelRes);
                    }
                });
                break;



            default:
                let responseData = {
                    result: false,
                    value: "Wrong Transaction Code",
                }

                res.send(responseData);
                res.end();
                break;
        }
    }
}

module.exports = {
    custfunction: custfunction
};