var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//AGREGAR USUARIO
router.get('/', isLoggedIn,function(req, res, next) {

    res.render('clientes')
});

router.get('/cliente', isLoggedIn,function(req, res, next) {

    res.render('cliente')
});

module.exports = router;