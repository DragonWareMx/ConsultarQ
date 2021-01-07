var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

router.get('/', isLoggedIn, function(req, res, next) {
    res.render('carteraServicios')
});

router.get('/ver-servicio', isLoggedIn, function(req, res, next) {
    res.render('verServicio')
});

router.get('/agregar-servicio', isLoggedIn, function(req, res, next) {
    res.render('agregarServicio')
});

router.get('/editar-servicio', isLoggedIn, function(req, res, next) {
    res.render('editarServicio')
});


module.exports = router;