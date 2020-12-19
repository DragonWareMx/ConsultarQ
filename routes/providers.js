var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');

//sequelize models
const models = require('../models/index');

//  consulta todos los prestadores externos
router.get('/', isLoggedIn, function (req, res, next) {
    models.Provider.findAll({
        //  include: ["Providers_Area"]
    }).then(prestadores => {
        console.log(prestadores);
        res.render('prestadores_externos/prestadores', { prestadores })
    });
});

module.exports = router;