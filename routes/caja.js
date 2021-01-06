var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

router.get('/', isLoggedIn, function(req, res, next) {
    res.render('caja')
});
router.get('/agregar-registro', isLoggedIn, function(req, res, next) {
    res.render('agregarRegistro') 
});



module.exports = router;

