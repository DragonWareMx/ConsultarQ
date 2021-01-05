var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

router.get('/activos', isLoggedIn,function (req, res, next) {
    res.render('proyectos'); 
  });
  

module.exports = router;