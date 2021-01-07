var express = require('express');
var router = express.Router();
const { check, validationResult } = require('express-validator/check');
const {isLoggedIn , isNotLoggedIn} = require('../lib/auth');
//autenticacion
const passport = require('passport');

//sequelize models
const models = require('../models/index');

//  se consultan todos los conceptos
router.get('/', isLoggedIn, async (req, res, next) => {

    try {
        //VERIFICACION DEL PERMISO

        //obtenemos el usuario, su rol y su permiso
        let usuario = await models.User.findOne({
            where: {
                id: req.user.id
            },
            include: {
                model: models.Role,
                include: {
                    model: models.Permission,
                    where: { name: 'ur' }
                }
            }
        })

        if (usuario && usuario.Role && usuario.Role.Permissions) {
            //TIENE PERMISO DE DESPLEGAR VISTA
            models.Concept.findAll({
                order: [
                    ['id','ASC']
                ]
            }).then(conceptos => {
                return res.render('conceptos/conceptos', { conceptos })
            });
        }
        else {
            //NO TIENE PERMISOS
            return res.status(403).json(403)
        }
    }
    catch (error) {
        return res.status(403).json(403)
    }

});


module.exports = router;

