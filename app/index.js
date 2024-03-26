module.exports = (app) => {
    var multer = require('multer');
    var upload = multer();

    var adminC = require('../app/controller/JomMedic/Admin/adminController');
    app.post('/adminquery', adminC.adminfunction);

    var customerC = require('../app/controller/JomMedic/Customer/customerController');
    app.post('/customerquery', upload.single('file'), customerC.custfunction);

    var providerCtrl = require('../app/controller/providerCtrl');
    var unqCtrl = require('../app/controller/UniqueNumCtrl');
    var loginCtrl = require('../app/controller/loginCtrl');
    var ewallCtrl = require('../app/controller/ewalletCtrl');

    app.post('/query', providerCtrl.providerCheckPost);
    app.post('/AUT', providerCtrl.auditTrailCtrl);
    app.post('/UNQ', unqCtrl.uniqueNumberGen);
    app.post('/SIGNIN', loginCtrl.loginPost);
    app.post('/EWALL', ewallCtrl.ewalletCheckPost);

    var frontLayerDefend = require('../app/controller/providerController');
    app.post('/provider', frontLayerDefend.securityCheckPost);

};