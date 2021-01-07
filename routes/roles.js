var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const { isLoggedIn, isNotLoggedIn } = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//AGREGAR USUARIO
router.get('/', isLoggedIn, function (req, res, next) {
    models.Role.findAll({
        include: [{
            model: models.User,
            include: {
                model: models.Employee,
                attributes: ['name']
            }
        }, {
            model: models.Permission,
            attributes: ['name']
        }],
    }).then(roles => {
        res.render('roles', { roles })
    });
});

router.post('/create', isLoggedIn, async function (req, res, next) {
    var permsID = []
    for (var key in req.body) {
        if (key != "role_name") {
            const permission = await models.Permission.findOne({ where: { name: key }, raw: true });
            permsID.push(permission['id'])
        }
    }
    //se crea el rol
    models.Role.create({
        name: req.body.role_name
    }).then(async (rol) => {
        console.log(rol)
        await rol.setPermissions(permsID)
        res.send("si jaló");
    })
});

module.exports = router;