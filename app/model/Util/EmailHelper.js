const nodemailer = require('nodemailer');
require('dotenv').config();

var EmailHelper = function (rep) {
  this.receiver = rep.receiver;
};

//biocore smtp
EmailHelper.sendGB = function (data, result) {
  console.log(data, "send email data")
  //data : - receiver , subject , text

  // using biocore smtp
  const transporter = nodemailer.createTransport({
    pool: true,
    host: "smtp01.utem.edu.my",
    port: 587,
    secure: false, // use TLS
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    },
  });

  const mailOptions = {
    from: process.env.BIOCORE_ID,
    to: data.receiver,
    subject: data.subject,
    text: data.text,
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      console.error('there was an error: ', err);
      result(err, null);
    } else {
      result(null, response);
    }
  });
};

// gmail smtp
EmailHelper.sendGG = function (data, result) {

  const transporter = nodemailer.createTransport({
    pool: true,
    host: "SMTP.gmail.com",
    port: 587,
    secure: true, // use TLS
    auth: {
      user: data.user,
      pass: data.pass
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    },
  });

  const mailOptions = {
    from: data.sender,
    to: data.receiver,
    subject: data.subject,
    text: data.text,
  };

  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      console.error('email sending error: ', err);
      result(err, null);
    } else {
      result(null, response);
    }
  });
};

// gmail smtp with attachments
EmailHelper.sendGGWithAttachments = function (data, result) {

  const transporter = nodemailer.createTransport({
    pool: true,
    host: "SMTP.gmail.com",
    port: 587,
    secure: true, // use TLS
    auth: {
      user: data.user,
      pass: data.pass
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false
    },
  });

  const mailOptions = {
    from: data.sender,
    to: data.receiver,
    subject: data.subject,
    text: data.text,
    attachments: data.attachments
  };
  console.log(data.attachments)
  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      console.error('email sending error: ', err);
      result(err, null);
    } else {
      result(null, response);
    }
  });
};


module.exports = EmailHelper;