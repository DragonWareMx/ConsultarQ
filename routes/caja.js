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

//  se consultan solo los egresos
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

//  se consultan solo los ingresos
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
                    T_type: 'ingreso'
                }
            }).then(ingresos => {
                return res.render('caja/ingresos', { ingresos })
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

//  se consultan solo las transacciones que son deducibles
router.get('/deducibles', isLoggedIn, async (req, res, next) => {

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
                    invoice: 1
                }
            }).then(deducibles => {
                return res.render('caja/deducibles', { deducibles })
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

//  se consultan todas las transacciones
router.get('/historial', isLoggedIn, async (req, res, next) => {

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
                ]
            }).then(transacciones => {
                return res.render('caja/historial', { transacciones })
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

