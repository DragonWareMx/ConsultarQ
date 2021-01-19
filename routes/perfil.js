var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

router.get('/', isLoggedIn, function(req, res, next) {
    res.render('perfil')
});

router.get('/editar', isLoggedIn,function(req, res, next) {
    res.render('editarPerfil')
});

module.exports = router;