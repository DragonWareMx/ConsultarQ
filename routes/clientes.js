var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//CLIENTES
router.get('/', isLoggedIn, async function (req, res, next) {
    const clientes = await models.Client.findAll({ include: models.Client_Area });
    res.render('clientes', { clientes })
});
// router.get('/', isLoggedIn,function(req, res, next) {

//     res.render('clientes')
// });

router.get('/cliente', isLoggedIn,function(req, res, next) {

    res.render('cliente')
});

router.get('/generar-cotizacion', isLoggedIn,function(req, res, next) {

    res.render('generarCotizacion')
});

module.exports = router;