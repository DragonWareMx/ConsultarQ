var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//AGREGAR USUARIO
router.get('/', isLoggedIn, async function (req, res, next) {
    const clientes = await models.Client.findAll({ include: models.Client_Area });
    res.render('clientes', { clientes })
});

module.exports = router;