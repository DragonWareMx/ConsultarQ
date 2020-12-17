var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//AGREGAR USUARIO
router.get('/nuevo', function(req, res, next) {
    res.render('crearRol')
});

module.exports = router;