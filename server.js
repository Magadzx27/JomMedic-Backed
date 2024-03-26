const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require("path");
const port = 3001;


app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use(bodyParser.json({ limit: '200mb', extended: true }));

app.use(function (req, res, next) {
    // website
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-with,content-type');

    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

require('./app/index.js')(app, {});

app.listen(port, () => {
    console.log("im aliveeeee -> " + port);

});




