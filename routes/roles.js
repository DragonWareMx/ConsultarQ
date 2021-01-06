var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//AGREGAR USUARIO
router.get('/nuevo', isLoggedIn, function (req, res, next) {
    res.render('crearRol')
});

router.get('/', isLoggedIn, function (req, res, next) {
    models.Role.findAll({
        include: [{
            model: models.User
        }, {
            model: models.Permission
        }],
    }).then(roles => {
        res.render('roles', { roles })
    });
    /*
    models.Role.findAll({
        include: { all:true}
    }).then(roles => {
        console.log(roles)
        res.render('roles', { roles })
    });*/
});

module.exports = router;