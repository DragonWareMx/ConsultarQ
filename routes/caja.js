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

//  se consultan todos los egresos
router.get('/egresos', isLoggedIn, async (req, res, next) => {

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
            models.Transaction.findAll({
                include: [{
                    model: models.Pa_Type
                },
                {
                    model: models.Concept
                }],
                order: [
                    ['date','DESC']
                ], 
                where: {
                    T_type: 'egreso'
                }
            }).then(egresos => {
                return res.render('caja/egresos', { egresos })
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

/*  se consultan todos los ingresos
router.get('/ingresos', isLoggedIn, async (req, res, next) => {

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
            //obtiene todos los usuarios y roles y se manda a la vista
            models.User.findAll({
                include: [{
                    model: models.Transaction
                }, {
                    model: models.Pa_Type
                }]
            }).then(ingresos => {
                models.Transaction.findAll({
                        where: {
                            T_type: 'ingreso'
                        }
                    }
                ).then(tipos => {
                    return res.render('egresos', { ingresos, tipos })
                });
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

    res.render('egresos')
});
*/


module.exports = router;

